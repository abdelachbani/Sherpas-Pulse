/**
 * src/components/shared/DemoPitchHUD.tsx
 *
 * Demo Day "Pitch Mode" Floating HUD:
 * Empowers the presenter (or jury member) to effortlessly navigate across
 * the 6 key pillars of Sherpas Pulse during the 2-minute pitch,
 * highlighting exactly how the solution satisfies Borja's rubric.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  X,
  Play,
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

interface Milestone {
  id: string;
  name: string;
  rubricPillar: string;
  path: (caseId: string) => string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'stories',
    name: '1. Financial Wrapped Stories',
    rubricPillar: 'Pillar 1 · 20 pts Captivating',
    path: (caseId) => `/case/${caseId}/stories`,
    icon: Compass,
    description: '25s vertical stories with Spotify Wrapped feel and voice narration.',
  },
  {
    id: 'calibration',
    name: '2. Zero-Prompt Calibration',
    rubricPillar: 'Pillar 1 · 20 pts Understanding',
    path: (caseId) => `/case/${caseId}/stories`,
    icon: ShieldCheck,
    description: 'Implicit pause detection with Beginner Analogy vs. Expert Mechanics.',
  },
  {
    id: 'allocator',
    name: '3. Tactile Cash Tank Allocator',
    rubricPillar: 'Pillar 2 · 20 pts Action / 15 pts Personal',
    path: (caseId) => `/case/${caseId}/allocate`,
    icon: Sliders,
    description: 'Interactive liquidity reservoir drainage for competing strategies.',
  },
  {
    id: 'sync',
    name: '4. Family Sync Consensus',
    rubricPillar: 'Pillar 2 · 15 pts Personal & Creativity',
    path: (caseId) => `/case/${caseId}/sync`,
    icon: Users,
    description: 'Green Zone agreements (pay $18k card) + Amber Zone tie-breakers.',
  },
  {
    id: 'action',
    name: '5. 5-Min Win & Multi-Touch (1-30d)',
    rubricPillar: 'Pillar 4 · 20 pts Motivation to Act',
    path: (caseId) => `/case/${caseId}/action`,
    icon: Calendar,
    description: 'The first domino with .ics calendar reminder and 4-phase touchpoints.',
  },
  {
    id: 'advisor',
    name: '6. Advisor Telemetry & Cheat-Sheet',
    rubricPillar: 'Pillar 4 · 15 pts Ready to Use & Business',
    path: (caseId) => `/case/${caseId}/advisor`,
    icon: Activity,
    description: 'Comprehension Index (92%) and 3 Human Questions for the Zoom call.',
  },
];

export function DemoPitchHUD() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCaseId, setActiveCaseId] = useState('timothy-melanie-weah');
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-3 right-3 z-50 pointer-events-auto font-sans">
      {/* Floating Pill Trigger */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-950/80 backdrop-blur-md border border-indigo-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          title="Open Hackathon Demo Pitch Navigator"
          aria-label="Open Demo Pitch HUD"
        >
          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse" />
          <span>Demo Pitch HUD</span>
        </button>
      )}

      {/* Expanded Modal / HUD Drawer */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Demo Pitch HUD"
          className="w-[92vw] max-w-sm rounded-3xl bg-slate-900/95 border border-indigo-500/40 p-4 text-white shadow-2xl shadow-black/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">2-Minute Pitch Navigator</h3>
                <p className="text-[10px] text-indigo-300 font-mono">100/100 Rubric Checklist</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
                const isCouple = c.household.length > 1;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCaseId(c.id)}
                    className={`py-1.5 px-2 rounded-xl text-left border text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate">{c.household.map((h) => h.first_name).join(' & ')}</div>
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
                    <div className="text-[10px] text-indigo-300/90 font-medium mt-0.5">{m.rubricPillar}</div>
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
              100% Grounded MCP Data
            </span>
            <span className="font-mono text-slate-500">Demo Day Ready</span>
          </div>
        </div>
      )}
    </div>
  );
}
