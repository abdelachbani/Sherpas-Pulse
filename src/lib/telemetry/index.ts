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
    }
  }

  const uniqueTerms = [...termsByKey.values()];
  return {
    eventCount: events.length,
    termConsultations: {
      count: termConsultationCount,
      uniqueTerms,
      uniqueTermCount: uniqueTerms.length,
    },
    interactions: { tradeoffChanges, allocationChanges, voiceAsks, languageModeChanges },
    shouldSuggestCalibration: uniqueTerms.length >= CALIBRATION_TERM_THRESHOLD,
  };
}

/** Serialise the event log to a JSON blob for upload. */
export function serialiseTelemetry(events: readonly TelemetryEvent[]): string {
  return JSON.stringify({ session: Date.now(), events }, null, 2);
}
