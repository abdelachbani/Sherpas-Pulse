/**
 * src/stores/appStore.ts
 * Global Zustand store — single source of truth for the app session.
 */

import { create } from 'zustand';
import type { CaseData, CoupleAllocation, TelemetryEvent, ViewingStyle } from '../types';
import { CASES } from '../lib/mcp/cases';

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
  setAllocation(partner: 'primary' | 'secondary', alloc: CoupleAllocation): void;
  reset(): void;
}

export const useAppStore = create<AppStore>((set) => ({
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
    set({ currentCase: found, currentStoryIndex: 0 });
  },

  setStoryIndex: (n) => set({ currentStoryIndex: n }),

  setViewingStyle: (s) => set({ viewingStyle: s }),

  setPartner: (p) => set({ partner: p }),

  addTelemetryEvent: (e) =>
    set((state) => ({ telemetryEvents: [...state.telemetryEvents, e] })),

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
