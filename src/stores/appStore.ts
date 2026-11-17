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
      currentCase: found, currentStoryIndex: 0, viewingStyle: null, languageMode: 'standard', partner: null,
      telemetryEvents, coupleAllocations: { primary: null, secondary: null },
    });
    persistTelemetrySession(found?.id ?? null, telemetryEvents);
  },

  setStoryIndex: (n) => set({ currentStoryIndex: n }),

  setViewingStyle: (s) => set({ viewingStyle: s }),

  setLanguageMode: (mode) => {
    if (get().languageMode === mode) return;
    appendTelemetryEvent(mkEvent('language_mode_change', { languageMode: mode }), mode);
  },

  setPartner: (p) => set({ partner: p }),

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

  setAllocation: (partner, alloc) =>
    set((state) => ({
      coupleAllocations: { ...state.coupleAllocations, [partner]: alloc },
    })),

  reset: () => {
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
