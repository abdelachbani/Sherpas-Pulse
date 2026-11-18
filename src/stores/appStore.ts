/**
 * src/stores/appStore.ts
 * Global Zustand store — single source of truth for the app session.
 */

import { create } from 'zustand';
import type {
  CaseData,
  CoupleAllocation,
  HesitationPausePayload,
  LanguageMode,
  TelemetryEvent,
  TelemetrySummary,
  ViewingStyle,
} from '../types';
import { CASES } from '../lib/mcp/cases';
import { clearChecklist } from '../lib/sessionChecklist';
import {
  getTelemetrySummary as summarizeTelemetry,
  loadTelemetrySession,
  mkEvent,
  mkTermConsultationEvent,
  persistTelemetrySession,
} from '../lib/telemetry';

interface AppStore {
  // ── State ────────────────────────────────────────────────────────────────
  currentCase:        CaseData | null;
  currentStoryIndex:  number;
  viewingStyle:       ViewingStyle | null;
  languageMode:       LanguageMode;
  partner:            'primary' | 'secondary' | null;
  telemetryEvents:    TelemetryEvent[];
  coupleAllocations:  { primary: CoupleAllocation | null; secondary: CoupleAllocation | null };

  // ── Actions ──────────────────────────────────────────────────────────────
  setCase(caseId: string): void;
  setStoryIndex(n: number): void;
  setViewingStyle(s: ViewingStyle): void;
  setLanguageMode(mode: LanguageMode): void;
  setPartner(p: 'primary' | 'secondary'): void;
  addTelemetryEvent(e: TelemetryEvent): void;
  trackTermConsulted(term: string, storyId?: string): void;
  trackTradeoffChange(payload: Record<string, unknown>, storyId?: string): void;
  trackAllocationChange(payload: Record<string, unknown>, storyId?: string): void;
  trackVoiceAsk(payload: Record<string, unknown>, storyId?: string): void;
  trackHesitationPause(payload: HesitationPausePayload, storyId?: string): void;
  getTelemetrySummary(): TelemetrySummary;
  shouldSuggestCalibration(): boolean;
  setAllocation(partner: 'primary' | 'secondary', alloc: CoupleAllocation): void;
  reset(): void;
}

type Priorities = Pick<AppStore, 'coupleAllocations' | 'partner'>;

function emptyPriorities(): Priorities {
  return { partner: null, coupleAllocations: { primary: null, secondary: null } };
}

function allocationKey(caseId: string) { return `sherpas-priorities:${caseId}`; }

function validAllocation(value: unknown): value is CoupleAllocation {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<CoupleAllocation>;
  return typeof item.partner === 'string' && Array.isArray(item.allocations) && item.allocations.every(entry =>
    entry && typeof entry.strategyId === 'string' && typeof entry.label === 'string'
    && Number.isFinite(entry.amount) && Number.isInteger(entry.priority) && entry.priority >= 0);
}

function loadPriorities(caseId: string): Priorities {
  try {
    const saved: Partial<Priorities> | null = JSON.parse(sessionStorage.getItem(allocationKey(caseId)) ?? 'null');
    const { primary, secondary } = saved?.coupleAllocations ?? {};
    return {
      partner: saved?.partner === 'primary' || saved?.partner === 'secondary' ? saved.partner : null,
      coupleAllocations: { primary: validAllocation(primary) ? primary : null, secondary: validAllocation(secondary) ? secondary : null },
    };
  } catch {
    return emptyPriorities();
  }
}

function persistPriorities({ currentCase, coupleAllocations, partner }: AppStore) {
  if (currentCase?.householdType !== 'couple') return;
  try { sessionStorage.setItem(allocationKey(currentCase.id), JSON.stringify({ coupleAllocations, partner })); } catch { /* Keep the in-memory session. */ }
}

export const useAppStore = create<AppStore>((set, get) => {
  const appendTelemetryEvent = (event: TelemetryEvent, languageMode?: LanguageMode) => {
    const state = get();
    const telemetryEvents = [...state.telemetryEvents, event];
    set(languageMode ? { languageMode, telemetryEvents } : { telemetryEvents });
    persistTelemetrySession(state.currentCase?.id ?? null, telemetryEvents);
  };

  return {
  // ── Initial state ────────────────────────────────────────────────────────
  currentCase:        null,
  currentStoryIndex:  0,
  viewingStyle:       null,
  languageMode:       'standard',
  partner:            null,
  telemetryEvents:    [],
  coupleAllocations:  { primary: null, secondary: null },

  // ── Action implementations ───────────────────────────────────────────────
  setCase: (caseId) => {
    const found = CASES.find((c) => c.id === caseId) ?? null;
    if (get().currentCase?.id === found?.id) return;
    const telemetryEvents = found ? loadTelemetrySession(found.id) : [];
    set({
      currentCase: found, currentStoryIndex: 0, viewingStyle: null, languageMode: 'standard',
      telemetryEvents, ...(found?.householdType === 'couple' ? loadPriorities(found.id) : emptyPriorities()),
    });
    persistTelemetrySession(found?.id ?? null, telemetryEvents);
  },

  setStoryIndex: (n) => set({ currentStoryIndex: n }),

  setViewingStyle: (s) => set({ viewingStyle: s }),

  setLanguageMode: (mode) => {
    if (get().languageMode === mode) return;
    appendTelemetryEvent(mkEvent('language_mode_change', { languageMode: mode }), mode);
  },

  setPartner: (p) => { set({ partner: p }); persistPriorities(get()); },

  addTelemetryEvent: (e) => appendTelemetryEvent(e),

  trackTermConsulted: (term, storyId) => appendTelemetryEvent(mkTermConsultationEvent(term, storyId)),

  trackTradeoffChange: (payload, storyId) => appendTelemetryEvent(mkEvent('tradeoff_change', payload, storyId)),

  trackAllocationChange: (payload, storyId) => appendTelemetryEvent(mkEvent('allocation_change', payload, storyId)),

  trackVoiceAsk: (payload, storyId) => appendTelemetryEvent(mkEvent('voice_ask', payload, storyId)),

  trackHesitationPause: (payload, storyId) => {
    const alreadyRecorded = get().telemetryEvents.some((event) =>
      event.type === 'hesitation_pause' && event.payload.frameId === payload.frameId);
    if (alreadyRecorded) return;
    appendTelemetryEvent(mkEvent('hesitation_pause', payload, storyId));
  },

  getTelemetrySummary: () => summarizeTelemetry(get().telemetryEvents),

  shouldSuggestCalibration: () => summarizeTelemetry(get().telemetryEvents).shouldSuggestCalibration,

  setAllocation: (partner, alloc) => {
    set((state) => ({
      coupleAllocations: { ...state.coupleAllocations, [partner]: alloc },
    }));
    persistPriorities(get());
  },

  reset: () => {
    const caseId = get().currentCase?.id;
    if (caseId) {
      try {
        sessionStorage.removeItem(allocationKey(caseId));
        clearChecklist(sessionStorage, caseId);
      } catch { /* Storage may be unavailable. */ }
    }
    persistTelemetrySession(null, []);
    set({
      currentCase:       null,
      currentStoryIndex: 0,
      viewingStyle:      null,
      languageMode:       'standard',
      partner:           null,
      telemetryEvents:   [],
      coupleAllocations: { primary: null, secondary: null },
    });
  },
  };
});
