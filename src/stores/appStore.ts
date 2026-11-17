/**
 * src/stores/appStore.ts
 * Global Zustand store — single source of truth for the app session.
 */

import { create } from 'zustand';
import type {
  CaseData,
  CoupleAllocation,
  TelemetryEvent,
  TelemetrySummary,
  ViewingStyle,
} from '../types';
import { CASES } from '../lib/mcp/cases';
import {
  getTelemetrySummary as summarizeTelemetry,
  mkEvent,
  mkTermConsultationEvent,
} from '../lib/telemetry';

interface AppStore {
  // ── State ────────────────────────────────────────────────────────────────
  currentCase:        CaseData | null;
  currentStoryIndex:  number;
  viewingStyle:       ViewingStyle | null;
  partner:            'primary' | 'secondary' | null;
  telemetryEvents:    TelemetryEvent[];
  coupleAllocations:  { primary: CoupleAllocation | null; secondary: CoupleAllocation | null };

  // ── Actions ──────────────────────────────────────────────────────────────
  setCase(caseId: string): void;
  setStoryIndex(n: number): void;
  setViewingStyle(s: ViewingStyle): void;
  setPartner(p: 'primary' | 'secondary'): void;
  addTelemetryEvent(e: TelemetryEvent): void;
  trackTermConsulted(term: string, storyId?: string): void;
  trackTradeoffChange(payload: Record<string, unknown>, storyId?: string): void;
  trackAllocationChange(payload: Record<string, unknown>, storyId?: string): void;
  trackVoiceAsk(payload: Record<string, unknown>, storyId?: string): void;
  getTelemetrySummary(): TelemetrySummary;
  shouldSuggestCalibration(): boolean;
  setAllocation(partner: 'primary' | 'secondary', alloc: CoupleAllocation): void;
  reset(): void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Initial state ────────────────────────────────────────────────────────
  currentCase:        null,
  currentStoryIndex:  0,
  viewingStyle:       null,
  partner:            null,
  telemetryEvents:    [],
  coupleAllocations:  { primary: null, secondary: null },

  // ── Action implementations ───────────────────────────────────────────────
  setCase: (caseId) => {
    const found = CASES.find((c) => c.id === caseId) ?? null;
    if (get().currentCase?.id === found?.id) return;
    set({
      currentCase: found, currentStoryIndex: 0, viewingStyle: null, partner: null,
      telemetryEvents: [], coupleAllocations: { primary: null, secondary: null },
    });
  },

  setStoryIndex: (n) => set({ currentStoryIndex: n }),

  setViewingStyle: (s) => set({ viewingStyle: s }),

  setPartner: (p) => set({ partner: p }),

  addTelemetryEvent: (e) =>
    set((state) => ({ telemetryEvents: [...state.telemetryEvents, e] })),

  trackTermConsulted: (term, storyId) =>
    set((state) => ({
      telemetryEvents: [...state.telemetryEvents, mkTermConsultationEvent(term, storyId)],
    })),

  trackTradeoffChange: (payload, storyId) =>
    set((state) => ({
      telemetryEvents: [...state.telemetryEvents, mkEvent('tradeoff_change', payload, storyId)],
    })),

  trackAllocationChange: (payload, storyId) =>
    set((state) => ({
      telemetryEvents: [...state.telemetryEvents, mkEvent('allocation_change', payload, storyId)],
    })),

  trackVoiceAsk: (payload, storyId) =>
    set((state) => ({
      telemetryEvents: [...state.telemetryEvents, mkEvent('voice_ask', payload, storyId)],
    })),

  getTelemetrySummary: () => summarizeTelemetry(get().telemetryEvents),

  shouldSuggestCalibration: () => summarizeTelemetry(get().telemetryEvents).shouldSuggestCalibration,

  setAllocation: (partner, alloc) =>
    set((state) => ({
      coupleAllocations: { ...state.coupleAllocations, [partner]: alloc },
    })),

  reset: () =>
    set({
      currentCase:       null,
      currentStoryIndex: 0,
      viewingStyle:      null,
      partner:           null,
      telemetryEvents:   [],
      coupleAllocations: { primary: null, secondary: null },
    }),
}));
