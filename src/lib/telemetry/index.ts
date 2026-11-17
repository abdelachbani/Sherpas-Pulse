/**
 * src/lib/telemetry/index.ts
 * Session telemetry helpers.
 * Events are stored in the Zustand appStore and can be flushed to an endpoint.
 */

import type {
  TelemetryEvent,
  TelemetryEventType,
  TelemetrySummary,
  TermConsultationPayload,
} from '../../types';

export const CALIBRATION_TERM_THRESHOLD = 3;
export const HESITATION_PAUSE_MS = 4000;
export const CALIBRATION_HESITATION_THRESHOLD = 1;
export const TELEMETRY_SESSION_STORAGE_KEY = 'sherpas-pulse:telemetry-session';

const TELEMETRY_EVENT_TYPES = new Set<TelemetryEventType>([
  'term_tap',
  'tap_to_define',
  'pause',
  'voice_ask',
  'tradeoff_change',
  'allocation_change',
  'allocation_set',
  'story_complete',
  'style_select',
  'language_mode_change',
  'hesitation_pause',
  'grounding_view',
]);

export interface ComprehensionSignals {
  uniqueTermCount: number;
  hesitationPauses: number;
  tradeoffChanges: number;
  allocationChanges: number;
}

interface StoredTelemetrySession {
  caseId: string;
  events: TelemetryEvent[];
}

/** Build a typed telemetry event. */
export function mkEvent<
  TType extends TelemetryEventType,
  TPayload extends Record<string, unknown>,
>(
  type: TType,
  payload: TPayload,
  storyId?: string,
): TelemetryEvent<TType, TPayload> {
  return { type, payload, timestamp: Date.now(), storyId };
}

function normalizeTerm(term: string): string {
  return term.trim().toLowerCase();
}

export function mkTermConsultationEvent(
  term: string,
  storyId?: string,
): TelemetryEvent<'tap_to_define', TermConsultationPayload> {
  const cleanedTerm = term.trim();
  if (!cleanedTerm) {
    throw new Error('A term is required for a term consultation event.');
  }

  return mkEvent('tap_to_define', {
    term: cleanedTerm,
    termKey: normalizeTerm(cleanedTerm),
  }, storyId);
}

export function hasReachedHesitationThreshold(inactiveMs: number): boolean {
  return Number.isFinite(inactiveMs) && inactiveMs >= HESITATION_PAUSE_MS;
}

/** Estimate understanding from help-seeking signals and plan engagement; this is not a measured score. */
export function estimateComprehensionIndex(signals: ComprehensionSignals): number | null {
  const changes = signals.tradeoffChanges + signals.allocationChanges;
  if (signals.uniqueTermCount + signals.hesitationPauses + changes === 0) return null;

  const uncertaintyPenalty = signals.uniqueTermCount * 8 + signals.hesitationPauses * 20;
  const engagementCredit = Math.min(15, changes * 3);
  return Math.max(0, Math.min(100, 100 - uncertaintyPenalty + engagementCredit));
}

/** Summarise interactions for the advisor handoff and calibration prompt. */
export function getTelemetrySummary(
  events: readonly TelemetryEvent[],
): TelemetrySummary {
  const termsByKey = new Map<string, string>();
  let termConsultationCount = 0;
  let tradeoffChanges = 0;
  let allocationChanges = 0;
  let voiceAsks = 0;
  let languageModeChanges = 0;
  let hesitationPauses = 0;

  for (const event of events) {
    switch (event.type) {
      case 'tap_to_define': {
        const term = event.payload.term;
        if (typeof term !== 'string' || !term.trim()) break;
        termConsultationCount += 1;
        const key = typeof event.payload.termKey === 'string' && event.payload.termKey.trim()
          ? event.payload.termKey.trim().toLowerCase()
          : normalizeTerm(term);
        if (!termsByKey.has(key)) termsByKey.set(key, term.trim());
        break;
      }
      case 'tradeoff_change':
        tradeoffChanges += 1;
        break;
      case 'allocation_change':
        allocationChanges += 1;
        break;
      case 'voice_ask':
        voiceAsks += 1;
        break;
      case 'language_mode_change':
        languageModeChanges += 1;
        break;
      case 'hesitation_pause':
        hesitationPauses += 1;
        break;
    }
  }

  const uniqueTerms = [...termsByKey.values()];
  const comprehensionIndex = estimateComprehensionIndex({
    uniqueTermCount: uniqueTerms.length,
    hesitationPauses,
    tradeoffChanges,
    allocationChanges,
  });
  const calibrationReason = uniqueTerms.length >= CALIBRATION_TERM_THRESHOLD
    ? 'term_consultations'
    : hesitationPauses >= CALIBRATION_HESITATION_THRESHOLD
      ? 'hesitation_pause'
      : null;
  return {
    eventCount: events.length,
    termConsultations: {
      count: termConsultationCount,
      uniqueTerms,
      uniqueTermCount: uniqueTerms.length,
    },
    interactions: { tradeoffChanges, allocationChanges, voiceAsks, languageModeChanges },
    hesitationPauses,
    comprehensionIndex,
    calibrationReason,
    shouldSuggestCalibration: calibrationReason !== null,
  };
}

export function loadTelemetrySession(caseId: string): TelemetryEvent[] {
  const storage = getSessionStorage();
  if (!storage) return [];

  try {
    const storedText = storage.getItem(TELEMETRY_SESSION_STORAGE_KEY);
    if (!storedText) return [];

    const stored: unknown = JSON.parse(storedText);
    if (!isStoredTelemetrySession(stored)) {
      console.warn('[telemetry] Ignoring malformed session data in sessionStorage.');
      return [];
    }
    if (stored.caseId !== caseId) return [];

    const validEvents = stored.events.filter(isTelemetryEvent);
    if (validEvents.length !== stored.events.length) {
      console.warn('[telemetry] Ignoring malformed events in sessionStorage.');
    }
    return validEvents;
  } catch (error) {
    console.warn('[telemetry] Could not restore session data from sessionStorage.', error);
    return [];
  }
}

export function persistTelemetrySession(caseId: string | null, events: readonly TelemetryEvent[]): void {
  const storage = getSessionStorage();
  if (!storage) return;

  try {
    if (!caseId) {
      storage.removeItem(TELEMETRY_SESSION_STORAGE_KEY);
      return;
    }
    storage.setItem(TELEMETRY_SESSION_STORAGE_KEY, JSON.stringify({ caseId, events }));
  } catch (error) {
    console.warn('[telemetry] Could not persist session data to sessionStorage.', error);
  }
}

/** Serialise the event log to a JSON blob for upload. */
export function serialiseTelemetry(events: readonly TelemetryEvent[]): string {
  return JSON.stringify({ session: Date.now(), events }, null, 2);
}

function getSessionStorage(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch (error) {
    console.warn('[telemetry] sessionStorage is unavailable.', error);
    return null;
  }
}

function isStoredTelemetrySession(value: unknown): value is StoredTelemetrySession {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.caseId === 'string' && Array.isArray(candidate.events);
}

function isTelemetryEvent(value: unknown): value is TelemetryEvent {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const payload = candidate.payload;
  return typeof candidate.type === 'string'
    && TELEMETRY_EVENT_TYPES.has(candidate.type as TelemetryEventType)
    && typeof candidate.timestamp === 'number'
    && typeof payload === 'object'
    && payload !== null
    && !Array.isArray(payload)
    && (candidate.storyId === undefined || typeof candidate.storyId === 'string');
}
