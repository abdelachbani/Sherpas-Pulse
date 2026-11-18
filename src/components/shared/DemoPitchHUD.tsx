/**
 * src/components/shared/DemoPitchHUD.tsx
 *
 * Demo Day "Pitch Mode" Floating HUD:
 * Empowers the presenter (or user) to effortlessly navigate across
 * the 6 key pillars of Sherpas Pulse during live demonstrations.
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  X,
  CheckCircle,
  Users,
  Compass,
  Sliders,
  ShieldCheck,
  Activity,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { CASES } from '../../lib/mcp/cases';
import { useDialogFocus } from './useDialogFocus';

interface Milestone {
  id: string;
  name: string;
  featureTag: string;
  path: (caseId: string) => string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'stories',
    name: '1. Financial Wrapped Stories',
    featureTag: 'Pillar 1 · Interactive Vertical Stories',
    path: (caseId) => `/case/${caseId}/stories`,
    icon: Compass,
    description: 'A mobile sequence of plan stories with optional voice.',
  },
  {
    id: 'calibration',
    name: '2. Zero-Prompt Calibration',
    featureTag: 'Pillar 1 · Dual Persona Calibration',
    path: (caseId) => `/case/${caseId}/stories`,
    icon: ShieldCheck,
    description: 'Implicit pause detection with Beginner Analogy vs. Expert Mechanics.',
  },
  {
    id: 'allocator',
    name: '3. Tactile Cash Tank Allocator',
    featureTag: 'Pillar 2 · Tactile Liquidity Tank',
    path: (caseId) => `/case/${caseId}/allocate`,
    icon: Sliders,
    description: 'Order plan strategies and review available cash.',
  },
  {
    id: 'sync',
    name: '4. Family Sync Consensus',
    featureTag: 'Pillar 2 · Asynchronous Couple Sync',
    path: (caseId) => `/case/${caseId}/sync`,
    icon: Users,
    description: 'Compare shared priorities and discussion topics.',
  },
  {
    id: 'action',
    name: '5. 5-Min Win & Multi-Touch (1-30d)',
    featureTag: 'Pillar 4 · 5-Minute Win & Follow-up',
    path: (caseId) => `/case/${caseId}/action`,
    icon: Calendar,
    description: 'Review recommendations and follow-up options.',
  },
  {
    id: 'advisor',
    name: '6. Advisor Telemetry & Cheat-Sheet',
    featureTag: 'Pillar 4 · Advisor Telemetry Dashboard',
    path: (caseId) => `/case/${caseId}/advisor`,
    icon: Activity,
    description: 'Review session signals and questions for the advisor.',
  },
];

export function DemoPitchHUD() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState('timothy-melanie-weah');
  const navigate = useNavigate();
  const location = useLocation();
  const dialogRef = useDialogFocus(isOpen, () => setIsOpen(false));
  const hudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (event.target instanceof Node && !hudRef.current?.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div ref={hudRef} className="demo-pitch-hud relative z-50 pointer-events-auto font-sans">
      {/* Floating Pill Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 cursor-pointer"
          title="Open demo navigator"
          aria-label="Open demo navigator"
        >
          <span className="relative grid h-4 w-4 place-items-center" aria-hidden="true">
            <span className="absolute inset-0 rounded-full border border-indigo-300 sm:hidden" />
            <Zap className="h-3.5 w-3.5 fill-indigo-700 text-indigo-700" />
          </span>
          <span className="hidden sm:inline">Demo navigator</span>
        </button>

      {/* Expanded Modal / HUD Drawer */}
      {isOpen && (
        <div
          ref={dialogRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label="Demo Pitch HUD"
          className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-sm max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-slate-900/95 border border-indigo-500/40 p-4 text-white shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Interactive Flow Navigator</h3>
                <p className="text-[10px] text-indigo-300 font-mono">End-to-End Product Tour</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close pitch navigator"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Household Selector */}
          <div className="pt-3 pb-2">
            <label className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1.5">
              Select Household Case:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {CASES.map((c) => {
                const isSelected = c.id === activeCaseId;
                const isCouple = c.householdType === 'couple';
                const members = c.financialHealth.case.household.filter((h) => h.role === 'client' || h.role === 'co-client');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCaseId(c.id)}
                    className={`min-h-11 py-1.5 px-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate">{members.map((h) => h.first_name).join(' & ')}</div>
                    <div className="text-[9px] font-normal text-slate-500">{isCouple ? 'Couple' : 'Single'}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestones List */}
          <div className="space-y-1.5 py-2 max-h-[50vh] overflow-y-auto no-scrollbar">
            {MILESTONES.map((m) => {
              const Icon = m.icon;
              const targetPath = m.path(activeCaseId);
              const isActive = location.pathname.startsWith(targetPath);

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleNavigate(targetPath)}
                  className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                    isActive
                      ? 'bg-indigo-950/70 border-indigo-500/80 shadow-md shadow-indigo-950/50'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${isActive ? 'bg-indigo-500/30 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="text-xs font-bold text-white truncate">{m.name}</div>
                      <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                    </div>
                    <div className="text-[10px] text-indigo-300/90 font-medium mt-0.5">{m.featureTag}</div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug line-clamp-1">{m.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer summary */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle className="w-3 h-3 text-emerald-400" />
              MCP data and session activity
            </span>
            <span className="font-mono text-slate-500">Demo Day Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
