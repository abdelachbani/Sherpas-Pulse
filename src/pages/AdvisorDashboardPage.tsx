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

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Users,
  User,
  FileText,
  Printer,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractWhatIfScenarios } from '../lib/mcp/extractor';
import { buildAdvisorQuestions, formatSessionHandoff } from '../lib/sessionHandoff';
import { getTelemetrySummary as summarizeTelemetry, serialiseTelemetry } from '../lib/telemetry';
import type { TelemetryEvent } from '../types';
import { FinancialText } from '../components/shared/FinancialText';
import { MultiTouchCadenceSection } from '../components/shared/MultiTouchCadenceSection';
import './advisor-dashboard.css';

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

  const [copiedJson, setCopiedJson] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const fh = activeCase.financialHealth;
  const household = fh.case.household;
  const clients = household.filter((p) => p.role === 'client' || p.role === 'co-client');
  const householdNames = clients.map((p) => p.first_name).join(' & ');

  const handoff = formatSessionHandoff(
    activeCase.id,
    hasLiveEvents ? liveEvents : [],
    currentCase?.id === activeCase.id ? allocations : { primary: null, secondary: null },
    extractWhatIfScenarios(fh, activeCase.investmentAnalysis),
  );

  // Zoom call cheat-sheet questions
  const advisorQuestions = buildAdvisorQuestions(
    sessionEvents,
    fh.score.top_moves.map((m) => m.title)
  );

  const primaryHesitationTerm = telemetrySummary.termConsultations.uniqueTerms[0] ?? 'your plan priorities';

  async function handleCopyJson() {
    setCopyError(false);
    setCopiedJson(false);
    try {
      await navigator.clipboard.writeText(serialiseTelemetry(sessionEvents));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  // Comprehension rating
  const compIndex = telemetrySummary.comprehensionIndex;
  const compLabel =
    compIndex == null ? 'More activity needed' : compIndex >= 80 ? 'High Clarity' : compIndex >= 65 ? 'Focused Hesitation' : 'High Friction / Calibration Needed';
  const compColor =
    compIndex == null ? 'text-slate-300' : compIndex >= 80 ? 'text-emerald-400' : compIndex >= 65 ? 'text-amber-400' : 'text-rose-400';

  return (
    <main className="advisor-dashboard min-h-dvh bg-slate-950 text-white pb-24">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-4 sm:px-6">
        <div className="advisor-header-inner max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Activity className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Advisor workspace
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Meeting prep for {householdNames}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review what the household explored and prepare for your next conversation.
            </p>
          </div>

          <div className="advisor-header-actions flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                hasLiveEvents
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/40'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${hasLiveEvents ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{hasLiveEvents ? `Live Session (${liveEvents.length} events)` : 'Sample activity'}</span>
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
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Financial Health Score</div>
            <div className="text-xl font-black text-white mt-1 flex items-baseline gap-1">
              <span>{fh.score.published_score}</span>
              <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
            <div className="text-[10px] text-amber-400 mt-0.5 font-semibold">
              {fh.score.band}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Household review</div>
            <div className="text-xl font-black text-white mt-1">
              {isCouple ? 'Couple' : 'Single'}
            </div>
            <div className="text-[10px] text-indigo-400 mt-0.5 font-semibold">
              {isCouple ? 'Partner priorities' : 'Individual priorities'}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] text-slate-400 font-medium">Recommendations</div>
            <div className="text-xl font-black text-white mt-1">{fh.score.top_moves.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              In the financial plan
            </div>
          </div>
        </section>

        {/* ── Pillar A: Comprehension Telemetry Metric Cards ────────────────── */}
        <section className="no-print rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h2 className="text-base font-bold text-white">Review activity</h2>
                <p className="text-xs text-slate-400">
                  Questions, terms and pauses from the review.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">{sessionEvents.length} events logged</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Comprehension Index */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-400">Estimated Comprehension Index</div>
                <div className={`text-3xl font-black mt-2 ${compColor}`}>
                  {compIndex == null ? "—" : `${compIndex}%`}
                </div>
                <div className={`text-xs font-bold mt-0.5 ${compColor}`}>{compLabel}</div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
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
                    <span className="text-xs text-slate-400 italic">No technical terms required calibration</span>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                Terms opened in the glossary during the review.
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
              </div>
              <p className="text-[10px] text-slate-400 mt-3 leading-relaxed">
                A pause can indicate time spent reading or thinking.
              </p>
            </div>
          </div>

          {/* Interactions Breakdown bar */}
          <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span>Voice questions asked: <strong className="text-white">{telemetrySummary.interactions.voiceAsks}</strong></span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Tactile allocation changes: <strong className="text-white">{telemetrySummary.interactions.allocationChanges}</strong></span>
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Calibration status: <strong className="text-emerald-400 font-semibold">{telemetrySummary.shouldSuggestCalibration ? 'Suggested' : 'No suggestion'}</strong></span>
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
                Saved priorities
              </h2>
              <p className="text-xs text-slate-400">
                {isCouple
                  ? 'Compare the order saved by each partner.'
                  : 'See how the household ranked the options before continuing.'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4" aria-label="Saved priority order">
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-200">
              <FinancialText text={handoff || 'No priorities have been saved for this household in this session.'} />
            </p>
          </div>
        </section>

        {/* ── Pillar C: Advisor Zoom Pre-Meeting Cheat-Sheet ────────────────── */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <HelpCircle className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white">
                Questions for the meeting
              </h2>
              <p className="text-xs text-slate-400">
                Use these prompts to open the conversation.
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
          isAdvisorView={true}
        />

        {/* ── Pillar E: Raw Telemetry Stream & JSON Exporter ────────────────── */}
        <section className="no-print rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4">
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
                    {e.storyId && <span className="text-slate-400">[{e.storyId}]</span>}
                    {typeof e.payload?.term === 'string' && (
                      <span className="text-amber-300">"{e.payload.term}"</span>
                    )}
                    {typeof e.payload?.inactiveMs === 'number' && (
                      <span className="text-rose-300">{e.payload.inactiveMs}ms pause</span>
                    )}
                  </div>
                  <span className="text-slate-400 text-[10px]">
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
                <span>Copy activity JSON</span>
              </>
            )}
          </button>
          {copyError && <p role="alert" className="mt-2 text-sm text-rose-300">Couldn’t copy the activity. Check clipboard permissions and try again.</p>}
        </section>
      </div>

      {/* ── Fixed Bottom Switcher: Mode Bar ───────────────────────────────── */}
      <div className="advisor-mode-switcher fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md py-3 px-4 shadow-2xl">
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
