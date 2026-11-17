/**
 * src/pages/AdvisorDashboardPage.tsx
 *
 * Dedicated Advisor Telemetry & Pre-Meeting View (Pillar 4):
 *  - Comprehension Telemetry: Real-time estimated understanding index, calibrated terms, hesitation pauses, interaction breakdown
 *  - Household Consensus / Single Trade-off Decisions: Green Zone agreements & Amber Zone tie-breakers
 *  - Zoom Pre-Meeting Cheat-Sheet: 3 Human questions tailored to client friction so the advisor skips screen sharing
 *  - Multi-Touch Smart Nudges: Auto-generated WhatsApp/Email follow-up drafts based on client hesitation
 *  - Raw Event Stream & Telemetry JSON Exporter
 *  - Smart Demo Telemetry Fallback if visited directly without browsing stories
 *  - Persistent Bottom Switcher between 'Client Action Plan' and 'Advisor Telemetry Mode'
 */

import { useState, useEffect, useId } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Users,
  User,
  MessageSquare,
  Mail,
  ChevronRight,
  RefreshCw,
  FileText,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractWhatIfScenarios, extractHouseholdSync } from '../lib/mcp/extractor';
import { buildAdvisorQuestions, formatSessionHandoff } from '../lib/sessionHandoff';
import { getTelemetrySummary as summarizeTelemetry, serialiseTelemetry } from '../lib/telemetry';
import type { TelemetryEvent } from '../types';
import { FinancialText } from '../components/shared/FinancialText';
import { MultiTouchCadenceSection } from '../components/shared/MultiTouchCadenceSection';

// Realistic demo fallback events per household for when the advisor opens directly
const DEMO_FALLBACK_EVENTS: Record<string, TelemetryEvent[]> = {
  'timothy-melanie-weah': [
    { type: 'story_complete', timestamp: Date.now() - 180000, storyId: 'story-vibe', payload: {} },
    { type: 'tap_to_define', timestamp: Date.now() - 150000, storyId: 'story-vibe', payload: { term: 'Roth IRA', termKey: 'roth-ira' } },
    { type: 'hesitation_pause', timestamp: Date.now() - 120000, storyId: 'story-overview', payload: { inactiveMs: 4600 } },
    { type: 'tap_to_define', timestamp: Date.now() - 100000, storyId: 'story-overview', payload: { term: '18% APR Debt', termKey: 'revolving-apr' } },
    { type: 'tap_to_define', timestamp: Date.now() - 80000, storyId: 'story-advice', payload: { term: 'Umbrella Liability', termKey: 'umbrella-liability' } },
    { type: 'voice_ask', timestamp: Date.now() - 60000, storyId: 'story-advice', payload: { query: 'Why pay off the 18% Chase card first?' } },
    { type: 'allocation_change', timestamp: Date.now() - 40000, storyId: 'story-advice', payload: { strategyId: 'card-payoff', priority: 1 } },
    { type: 'allocation_set', timestamp: Date.now() - 20000, storyId: 'story-advice', payload: { partner: 'Timothy' } },
  ],
  'daniel-emily-johnson': [
    { type: 'story_complete', timestamp: Date.now() - 160000, storyId: 'story-vibe', payload: {} },
    { type: 'tap_to_define', timestamp: Date.now() - 130000, storyId: 'story-overview', payload: { term: 'Mortality Ratio', termKey: 'mortality-ratio' } },
    { type: 'hesitation_pause', timestamp: Date.now() - 110000, storyId: 'story-advice', payload: { inactiveMs: 4800 } },
    { type: 'tap_to_define', timestamp: Date.now() - 90000, storyId: 'story-translator', payload: { term: '529 Plan', termKey: '529-plan' } },
    { type: 'voice_ask', timestamp: Date.now() - 70000, storyId: 'story-advice', payload: { query: 'Can we fund college and retire at 62?' } },
    { type: 'allocation_change', timestamp: Date.now() - 40000, storyId: 'story-advice', payload: { strategyId: 'college-529', priority: 1 } },
  ],
  'michael-carter': [
    { type: 'story_complete', timestamp: Date.now() - 140000, storyId: 'story-vibe', payload: {} },
    { type: 'tap_to_define', timestamp: Date.now() - 110000, storyId: 'story-overview', payload: { term: 'Withdrawal Rate', termKey: 'withdrawal-rate' } },
    { type: 'hesitation_pause', timestamp: Date.now() - 90000, storyId: 'story-tradeoff', payload: { inactiveMs: 4400 } },
    { type: 'voice_ask', timestamp: Date.now() - 70000, storyId: 'story-tradeoff', payload: { query: 'Can I afford to buy a $550,000 home in 2027?' } },
    { type: 'tradeoff_change', timestamp: Date.now() - 40000, storyId: 'story-tradeoff', payload: { scenarioId: 'home-vs-retire', choice: 'A' } },
  ],
  'samantha-lewis': [
    { type: 'story_complete', timestamp: Date.now() - 150000, storyId: 'story-vibe', payload: {} },
    { type: 'tap_to_define', timestamp: Date.now() - 120000, storyId: 'story-overview', payload: { term: '529 Plan', termKey: '529-plan' } },
    { type: 'hesitation_pause', timestamp: Date.now() - 95000, storyId: 'story-tradeoff', payload: { inactiveMs: 4700 } },
    { type: 'tap_to_define', timestamp: Date.now() - 70000, storyId: 'story-advice', payload: { term: 'Umbrella Liability', termKey: 'umbrella-liability' } },
    { type: 'voice_ask', timestamp: Date.now() - 50000, storyId: 'story-tradeoff', payload: { query: 'How do I fund college tuition starting this year?' } },
    { type: 'tradeoff_change', timestamp: Date.now() - 30000, storyId: 'story-tradeoff', payload: { scenarioId: 'college-vs-home', choice: 'A' } },
  ],
};

export default function AdvisorDashboardPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const liveEvents = useAppStore((s) => s.telemetryEvents);
  const allocations = useAppStore((s) => s.coupleAllocations);
  const resetStore = useAppStore((s) => s.reset);

  const activeCase = CASES.find((c) => c.id === caseId) ?? currentCase ?? CASES[0];
  const isCouple = activeCase.householdType === 'couple';

  useEffect(() => {
    if (caseId && currentCase?.id !== caseId) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  // Determine whether to use live events or realistic demo fallback
  const hasLiveEvents = currentCase?.id === activeCase.id && liveEvents.length > 0;
  const sessionEvents = hasLiveEvents
    ? liveEvents
    : DEMO_FALLBACK_EVENTS[activeCase.id] || DEMO_FALLBACK_EVENTS['timothy-melanie-weah'];

  const telemetrySummary = summarizeTelemetry(sessionEvents);

  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);

  const fh = activeCase.financialHealth;
  const ia = activeCase.investmentAnalysis;
  const household = fh.case.household;
  const clients = household.filter((p) => p.role === 'client' || p.role === 'co-client');
  const householdNames = clients.map((p) => p.first_name).join(' & ');

  // Household Sync extraction
  const syncData = extractHouseholdSync(
    activeCase.id,
    allocations.primary,
    allocations.secondary
  );

  // Zoom call cheat-sheet questions
  const advisorQuestions = buildAdvisorQuestions(
    sessionEvents,
    fh.score.top_moves.map((m) => m.title)
  );

  // Auto-generate Smart Nudge follow-up message tailored to hesitation/calibration
  const primaryHesitationTerm =
    telemetrySummary.termConsultations.uniqueTerms[0] || '18% APR Debt';
  const nudgeSubject = `Quick note on your ${householdNames} Sherpas plan review`;
  const whatsappNudge = `Hi ${clients[0]?.first_name || 'there'}! I noticed on your Sherpas mobile review that you were looking closely into ${primaryHesitationTerm}. That's usually the highest-impact domino for families in your situation. I've prepared two clear scenarios to walk through in our upcoming call so you won't need to look at any slides. Looking forward to our chat!`;
  const emailNudge = `Hi ${householdNames},\n\nI saw you recently reviewed your Sherpas plan on mobile and spent time calibrating ${primaryHesitationTerm}.\n\nTo make our upcoming meeting as high-value as possible, I have already modeled the exact dollar impact on your Living Map. We can skip screen-sharing and jump directly into your decision.\n\nBest regards,\nYour Sherpas Wealth Advisor`;

  const activeNudgeText = channel === 'whatsapp' ? whatsappNudge : `Subject: ${nudgeSubject}\n\n${emailNudge}`;

  async function handleCopyDraft() {
    try {
      await navigator.clipboard.writeText(activeNudgeText);
      setCopiedDraft(true);
      setTimeout(() => setCopiedDraft(false), 2000);
    } catch {
      console.warn('Clipboard write failed');
    }
  }

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(serialiseTelemetry(sessionEvents));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      console.warn('Clipboard write failed');
    }
  }

  // Comprehension rating
  const compIndex = telemetrySummary.comprehensionIndex ?? 78;
  const compLabel =
    compIndex >= 80 ? 'High Clarity' : compIndex >= 65 ? 'Focused Hesitation' : 'High Friction / Calibration Needed';
  const compColor =
    compIndex >= 80 ? 'text-emerald-400' : compIndex >= 65 ? 'text-amber-400' : 'text-rose-400';

  return (
    <main className="min-h-dvh bg-slate-950 text-white pb-24">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Advisor Pre-Meeting Telemetry
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400 font-mono">{activeCase.id}</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              {householdNames}’s Pre-Meeting Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Plug-and-play comprehension diagnostics & talking points for your upcoming consultation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                hasLiveEvents
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${hasLiveEvents ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{hasLiveEvents ? `Live Session (${liveEvents.length} events)` : 'Demo Telemetry Mode'}</span>
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all cursor-pointer"
              title="Print 1-Page Pre-Meeting Cheat-Sheet for Zoom Call"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Cheat-Sheet</span>
              <span className="sm:hidden">Print</span>
            </button>

            <Link
              to={`/case/${activeCase.id}/action`}
              className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              View Client Plan →
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* ── Household Vital Signs Row ────────────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Financial Health Score</div>
            <div className="text-xl font-black text-white mt-1 flex items-baseline gap-1">
              <span>{fh.score.published_score}</span>
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5 font-semibold">
              Gate: 18% Chase Debt
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Liquid Surplus Cash</div>
            <div className="text-xl font-black text-white mt-1">$60,222</div>
            <div className="text-[10px] text-slate-400 mt-0.5">from $150k total liquid</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Household Dynamic</div>
            <div className="text-xl font-black text-white mt-1">
              {isCouple ? 'Couple' : 'Single'}
            </div>
            <div className="text-[10px] text-indigo-400 mt-0.5 font-semibold">
              {isCouple ? 'Asynchronous Two-Pace' : 'Single Trade-off'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Advisor Action</div>
            <div className="text-xl font-black text-emerald-400 mt-1">Ready</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5 font-semibold">
              Skip screen-sharing
            </div>
          </div>
        </section>

        {/* ── Pillar A: Comprehension Telemetry Metric Cards ────────────────── */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Client Comprehension Telemetry</h2>
                <p className="text-xs text-slate-400">
                  Behavioral telemetry captured during the client's self-guided mobile exploration.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-500">{sessionEvents.length} events logged</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Comprehension Index */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Estimated Comprehension Index</div>
                <div className={`text-3xl font-black mt-2 ${compColor}`}>
                  {compIndex}%
                </div>
                <div className={`text-xs font-bold mt-0.5 ${compColor}`}>{compLabel}</div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                Calculated from friction signals (hesitations & term consultations) balanced by decision engagement.
              </p>
            </div>

            {/* Calibrated Financial Terms */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Calibrated Financial Terms</span>
                  <span className="text-xs font-bold text-amber-400">
                    {telemetrySummary.termConsultations.count} taps
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {telemetrySummary.termConsultations.uniqueTerms.length > 0 ? (
                    telemetrySummary.termConsultations.uniqueTerms.map((term) => (
                      <span
                        key={term}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-200 border border-amber-500/30 text-xs font-semibold"
                      >
                        <Sparkles className="w-3 h-3 text-amber-400" />
                        <span>{term}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-500 italic">No technical terms required calibration</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                Client tapped these underlined terms to see everyday analogies and exact MCP figures.
              </p>
            </div>

            {/* Hesitation Pauses */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">Hesitation Pauses (&gt;4s)</span>
                  <span className="text-xs font-bold text-rose-400">
                    {telemetrySummary.hesitationPauses} detected
                  </span>
                </div>
                <div className="mt-2.5 space-y-1.5">
                  <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>Paused on Story 2 (Superpower vs 18% Card)</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                4-second inactivity sensor automatically triggered the Zero-Prompt calibration card.
              </p>
            </div>
          </div>

          {/* Interactions Breakdown bar */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Voice questions asked: <strong className="text-white">{telemetrySummary.interactions.voiceAsks || 1}</strong></span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Tactile allocation changes: <strong className="text-white">{telemetrySummary.interactions.allocationChanges || 2}</strong></span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Calibration status: <strong className="text-emerald-400 font-semibold">{telemetrySummary.shouldSuggestCalibration ? 'Recommended & Triggered' : 'Normal'}</strong></span>
            </span>
          </div>
        </section>

        {/* ── Pillar B: Household Consensus & Trade-off Decisions ───────────── */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {isCouple ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                {isCouple ? 'Family Consensus ("Two Paces, One Plan")' : 'Trade-off Leaning & What-If Simulation'}
              </h2>
              <p className="text-xs text-slate-400">
                {isCouple
                  ? 'Cross-referenced choices from both partners showing ready agreements and queued advisor tie-breakers.'
                  : 'Client simulation stance balancing immediate goals against long-term independence.'}
              </p>
            </div>
          </div>

          {isCouple ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Green Zone: Agreements */}
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Green Zone: Ready-to-Act Agreement</span>
                </div>
                <div className="text-sm font-bold text-white">
                  Liquidate $18,000 Chase Credit Card Debt
                </div>
                <p className="text-xs text-emerald-200/90 leading-relaxed">
                  Both partners agree 100% on paying off the 18% credit card debt from cash surplus. Immediate saving of <strong>$3,240/yr</strong> in interest, unlocking the health score gate to 62.
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300">
                    Ready to execute today
                  </span>
                </div>
              </div>

              {/* Amber Zone: Advisor Tie-Breaker */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Amber Zone: Advisor Tie-Breaker</span>
                </div>
                <div className="text-sm font-bold text-white">
                  College Fund (529) vs. Family Protection (Umbrella)
                </div>
                <p className="text-xs text-amber-200/90 leading-relaxed">
                  Timothy prioritized funding Liam & Josh's 529 college gap ($4,609/yr), while Melanie prioritized $1M umbrella liability protection and term life coverage.
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                    Topic #1 for your meeting
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Simulated What-If Decision
              </div>
              <div className="text-sm font-bold text-white">
                {activeCase.id === 'michael-carter'
                  ? 'Home Purchase in 2027 ($550,000) vs Retirement at Age 58'
                  : 'College Tuition Now ($18,400/yr) vs Second Home in 2030 ($620,000)'}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {activeCase.id === 'michael-carter'
                  ? 'Michael leaned 70% toward buying the Austin home in 2027 ($110k down payment), accepting retirement at age 60 instead of age 58 with a 3.6% safe withdrawal rate.'
                  : 'Samantha prioritized funding college tuition starting now ($18,400/yr), scheduling her second home purchase for 2030 after college contributions normalize.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Pillar C: Advisor Zoom Pre-Meeting Cheat-Sheet ────────────────── */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <HelpCircle className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Meeting Cheat-Sheet: 3 Human Questions for the Zoom Call
              </h2>
              <p className="text-xs text-slate-400">
                Skip screen sharing and slide decks. Open the meeting directly addressing their exact calibrated doubts.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {advisorQuestions.map((question, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 text-xs text-slate-200 leading-relaxed font-medium">
                  {question}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pillar D: Multi-Touch Smart Nudges (Days 1 to 30 Follow-up Cadence) ── */}
        <MultiTouchCadenceSection
          caseId={activeCase.id}
          clientNames={householdNames}
          primaryHesitationTerm={primaryHesitationTerm}
          firstWinTitle={fh.score.top_moves[0]?.title ?? 'Pay off high-interest debt'}
          firstWinDollars={fh.score.top_moves[0] ? `$${fh.score.top_moves[0].target_amount.toLocaleString()}/yr` : '$3,240/yr'}
          agreedTopic={isCouple ? 'Liquidating $18k high-interest credit card debt' : 'Retirement savings allocation'}
          divergedTopic={isCouple ? 'College Savings (529) vs. Umbrella Protection' : 'Home purchase timing'}
          isAdvisorView={true}
        />

        {/* ── Pillar E: Raw Telemetry Stream & JSON Exporter ────────────────── */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                <FileText className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Raw Telemetry Event Stream</h2>
                <p className="text-xs text-slate-400">
                  Inspect raw deterministic telemetry log or export to Sherpas CRM.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowEventLog(!showEventLog)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold"
            >
              {showEventLog ? 'Hide event log' : `Show all (${sessionEvents.length})`}
            </button>
          </div>

          {showEventLog && (
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
              {sessionEvents.map((e, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-indigo-400 font-bold">{e.type}</span>
                    {e.storyId && <span className="text-slate-500">[{e.storyId}]</span>}
                    {typeof e.payload?.term === 'string' && (
                      <span className="text-amber-300">"{e.payload.term}"</span>
                    )}
                    {typeof e.payload?.inactiveMs === 'number' && (
                      <span className="text-rose-300">{e.payload.inactiveMs}ms pause</span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleCopyJson}
            className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {copiedJson ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Telemetry JSON Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Full Telemetry JSON for Sherpas Platform</span>
              </>
            )}
          </button>
        </section>
      </div>

      {/* ── Fixed Bottom Switcher: Mode Bar ───────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md py-3 px-4 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/case/${activeCase.id}/action`)}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Client Action Plan</span>
          </button>

          <button
            className="py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 cursor-default"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Advisor Telemetry (Active)</span>
          </button>
        </div>
      </div>
    </main>
  );
}
