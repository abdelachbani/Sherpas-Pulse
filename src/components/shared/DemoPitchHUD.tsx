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
  Clock,
  Sparkles,
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

interface PitchBeat {
  time: string;
  title: string;
  targetScreen: string;
  path: (caseId: string) => string;
  script: string;
  keyVisual: string;
}

const PITCH_BEATS: PitchBeat[] = [
  {
    time: '0:00 - 0:25',
    title: 'The Hook & The 40-Page Dilemma',
    targetScreen: 'Story Intro',
    path: (caseId) => `/case/${caseId}/stories`,
    script:
      '"Traditional 40-page financial plans experience massive client drop-off. Couples dont read them, freeze, or disagree. Sherpas Pulse transforms raw MCP financial data into a 3-minute interactive Financial Wrapped guided by Sherpi."',
    keyVisual: 'Mascot Sherpi welcomes client + dynamic Spotify-style story progress bars.',
  },
  {
    time: '0:25 - 0:55',
    title: 'Zero-Prompt Calibration & Dual Personas',
    targetScreen: 'Story Calibration',
    path: (caseId) => `/case/${caseId}/stories`,
    script:
      '"When a client hesitates on complex terms, Pulse passively detects dwell time without nagging prompts. The micro-card toggles between Everyday Analogy for beginners and Financial Mechanics for experts, backed by zero-hallucination voice answers."',
    keyVisual: 'Tap Dual Mode toggle (Everyday Analogy vs. Financial Mechanics) + Sherpi checkpoint.',
  },
  {
    time: '0:55 - 1:25',
    title: 'Tactile Cash Tank & Family Sync',
    targetScreen: 'Cash Allocator & Sync',
    path: (caseId) => `/case/${caseId}/sync`,
    script:
      '"Couples rarely budget together. One partner scans the live QR code on mobile. Our Cash Tank allocator balances surplus dollars, while Family Sync automatically detects instant agreements in green and frames tie-breakers for the advisor in amber."',
    keyVisual: 'Green agreed badges + Amber advisor discussion topics + Partner badges.',
  },
  {
    time: '1:25 - 1:45',
    title: 'The First Domino & Multi-Touch Cadence',
    targetScreen: 'Action Plan',
    path: (caseId) => `/case/${caseId}/action`,
    script:
      '"Advice dies without immediate execution. We surface the First Domino—a 5-minute win to build momentum—accompanied by a Days 1 to 30 follow-up timeline with one-tap .ics calendar sync and WhatsApp drafts."',
    keyVisual: '5-Minute Win checklist + Calendar download + WhatsApp/Email share buttons.',
  },
  {
    time: '1:45 - 2:00',
    title: 'Pre-Meeting Advisor Telemetry & Cheat-Sheet',
    targetScreen: 'Advisor Dashboard',
    path: (caseId) => `/case/${caseId}/advisor`,
    script:
      '"Before opening the Zoom meeting, the advisor reviews client dwell telemetry, hesitation hotspots, and an ink-friendly 1-page printable cheat-sheet. Transforming passive static PDF delivery into measurable joint client action."',
    keyVisual: 'Advisor Telemetry metrics + Hesitation triggers + Print Cheat-Sheet button.',
  },
];

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
  const [activeTab, setActiveTab] = useState<'navigator' | 'pitch'>('navigator');
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
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
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

          {/* Tab Switcher: Flow Navigator vs 2-Min Pitch Script */}
          <div className="flex rounded-xl bg-slate-950/70 p-1 border border-slate-800/80 my-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('navigator')}
              className={`flex-1 min-h-9 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'navigator'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Flow Navigator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pitch')}
              className={`flex-1 min-h-9 py-1 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'pitch'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>2-Min Pitch Script</span>
            </button>
          </div>

          {/* Household Selector */}
          <div className="pt-1 pb-2">
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

          {/* TAB 1: FLOW NAVIGATOR */}
          {activeTab === 'navigator' && (
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
          )}

          {/* TAB 2: 2-MINUTE PITCH SCRIPT & STORYBOARD */}
          {activeTab === 'pitch' && (
            <div className="space-y-2 py-2 max-h-[50vh] overflow-y-auto no-scrollbar">
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300 mb-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Room 2.3 Presentation Track</span>
                </div>
                <span>Follow this 120-second cadence during the live pitch or 2-minute video. Tap any beat to jump straight to that screen.</span>
              </div>

              {PITCH_BEATS.map((beat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold">
                      ⏱️ {beat.time}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleNavigate(beat.path(activeCaseId))}
                      className="px-2 py-0.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Jump to {beat.targetScreen}</span>
                      <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  <h4 className="text-xs font-bold text-white tracking-tight">{beat.title}</h4>
                  <p className="text-[11px] text-slate-300 italic leading-relaxed bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    {beat.script}
                  </p>
                  <div className="text-[10px] text-slate-400">
                    <strong className="text-slate-300">Show on screen:</strong> {beat.keyVisual}
                  </div>
                </div>
              ))}
            </div>
          )}

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
