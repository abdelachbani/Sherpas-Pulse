import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Activity, User } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractWhatIfScenarios } from '../lib/mcp/extractor';
import { buildAdvisorQuestions, formatSessionHandoff } from '../lib/sessionHandoff';
import { getTelemetrySummary as summarizeTelemetry, serialiseTelemetry } from '../lib/telemetry';
import { FinancialText } from '../components/shared/FinancialText';
import { MultiTouchCadenceSection } from '../components/shared/MultiTouchCadenceSection';
import { loadChecklist, saveChecklist } from '../lib/sessionChecklist';

export default function ActionPage() {
  const { caseId } = useParams<{ caseId: string }>();
  if (!CASES.some((item) => item.id === caseId)) {
    return <main className="session-page min-h-dvh bg-[#171827] p-8 text-white"><h1 className="text-2xl font-semibold">Household not found</h1><p className="mt-3 text-sm text-slate-300">This household link is unavailable.</p><a href="/" className="mt-6 inline-flex min-h-11 items-center text-indigo-300 underline">Choose a household</a></main>;
  }
  return <ActionContent key={caseId} />;
}

function ActionContent() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const resetStore = useAppStore((s) => s.reset);
  const allocations = useAppStore((s) => s.coupleAllocations);
  const events = useAppStore((s) => s.telemetryEvents);
  const matchingCase = currentCase?.id === caseId;
  const sessionEvents = matchingCase ? events : [];
  const telemetrySummary = summarizeTelemetry(sessionEvents);
  const checkboxPrefix = useId();
  const activeCase = (currentCase?.id === caseId ? currentCase : CASES.find((c) => c.id === caseId))!;
  const [done, setDone] = useState<number[]>(() => {
    try { return loadChecklist(sessionStorage, activeCase.id, activeCase.financialHealth.score.top_moves.length); }
    catch { return []; }
  });
  const [checklistError, setChecklistError] = useState(false);
  const toggleDone = (index: number) => {
    const next = done.includes(index) ? done.filter((item) => item !== index) : [...done, index];
    setDone(next);
    try { setChecklistError(!saveChecklist(sessionStorage, activeCase.id, next)); }
    catch { setChecklistError(true); }
  };
  const [tab, setTab] = useState<'plan' | 'advisor'>('plan');
  const [telemetryCopied, setTelemetryCopied] = useState(false);
  const [telemetryCopyError, setTelemetryCopyError] = useState<string | null>(null);
  useEffect(() => { if (caseId && currentCase?.id !== caseId) setCase(caseId); }, [caseId, currentCase, setCase]);

  const members = activeCase.financialHealth.case.household.filter((person) => person.role === 'client' || person.role === 'co-client');
  const names = members.map((person) => person.first_name).join(' & ');
  const moves = activeCase.financialHealth.score.top_moves;
  const advisorQuestions = buildAdvisorQuestions(sessionEvents, moves.map((move) => move.title));
  const handoff = formatSessionHandoff(activeCase.id, sessionEvents, matchingCase ? allocations : { primary: null, secondary: null }, extractWhatIfScenarios(activeCase.financialHealth, activeCase.investmentAnalysis));
  const copyTelemetry = async () => {
    setTelemetryCopied(false);
    setTelemetryCopyError(null);
    if (!navigator.clipboard?.writeText) {
      setTelemetryCopyError('Clipboard access is unavailable in this browser.');
      return;
    }
    try {
      await navigator.clipboard.writeText(serialiseTelemetry(sessionEvents));
      setTelemetryCopied(true);
    } catch (error) {
      console.error('[advisor handoff] Could not copy telemetry JSON.', error);
      setTelemetryCopyError('Could not copy telemetry JSON. Please try again.');
    }
  };
  const plan = <div className="p-5 sm:p-7 space-y-6 text-white">
    <header><p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Your next steps</p><h1 className="mt-2 text-3xl font-semibold">{names}’s action plan</h1><p className="mt-3 text-sm leading-relaxed text-slate-300">Review the recommendations from your plan and mark the steps you have completed.</p></header>
    <section className="space-y-3"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">Plan recommendations</h2><span className="text-sm text-slate-400">{done.length} / {moves.length} complete</span></div>
      {moves.length === 0 && <p className="text-sm text-slate-300">No recommendations are available for this plan.</p>}
      {moves.map((move, index) => <article key={`${move.title}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-5"><div className="flex items-start gap-3"><input id={`${checkboxPrefix}-move-${index}`} type="checkbox" aria-label={`Mark recommendation ${index + 1} complete`} checked={done.includes(index)} onChange={() => toggleDone(index)} className="mt-1 h-5 w-5 accent-indigo-500" /><div><h3 className="font-semibold text-white"><FinancialText text={move.title} /></h3><p className="mt-2 text-sm leading-relaxed text-slate-300"><FinancialText text={move.action} /></p></div></div></article>)}
    </section>
    {checklistError && <p role="alert" className="text-sm text-rose-300">Checklist changes could not be saved for this browser session.</p>}
    <MultiTouchCadenceSection
      caseId={activeCase.id}
      clientNames={names}
      primaryHesitationTerm={telemetrySummary.termConsultations.uniqueTerms[0] ?? 'Umbrella Liability'}
      firstWinTitle={moves[0]?.title ?? 'Pay off high-interest debt'}
      isAdvisorView={false}
    />
    <button type="button" onClick={() => { resetStore(); navigate('/'); }} className="min-h-11 w-full rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200">Start a new household session</button>
  </div>;
  const advisor = (
    <div className="p-5 sm:p-7 space-y-5 text-white">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">Pillar 4 · Pre-Meeting View</p>
          <h2 className="mt-1 text-2xl font-semibold">Advisor Telemetry & Discussion Overview</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">Review client comprehension, calibrated technical doubts, and consensus before meeting.</p>
        </div>
        <Link
          to={`/case/${activeCase.id}/advisor`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-colors shrink-0"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Open Full Advisor Dashboard →</span>
        </Link>
      </header>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="font-semibold">Plan recommendations</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          {moves.map((move, index) => <li key={`${move.title}-${index}`}><FinancialText text={move.title} /></li>)}
        </ul>
      </section>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="font-semibold">Saved session choices</h3>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          <FinancialText text={handoff || 'No choices have been saved in this session yet.'} />
        </p>
      </section>
      <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <h3 className="font-semibold">Session summary</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-slate-400">Terms consulted</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.termConsultations.count} ({telemetrySummary.termConsultations.uniqueTermCount} unique)</dd></div>
          <div><dt className="text-slate-400">Trade-off changes</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.interactions.tradeoffChanges}</dd></div>
          <div><dt className="text-slate-400">Allocation changes</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.interactions.allocationChanges}</dd></div>
          <div><dt className="text-slate-400">Voice asks</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.interactions.voiceAsks}</dd></div>
          <div><dt className="text-slate-400">Plain-language activations</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.interactions.languageModeChanges}</dd></div>
          <div><dt className="text-slate-400">Hesitation pauses</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.hesitationPauses}</dd></div>
          <div><dt className="text-slate-400">Estimated understanding</dt><dd className="mt-1 font-semibold text-white">{telemetrySummary.comprehensionIndex === null ? 'Not enough activity' : `${telemetrySummary.comprehensionIndex}%`}</dd></div>
        </dl>
        <p className="mt-2 text-xs text-slate-400">Directional estimate based on terms consulted, hesitation pauses, and plan changes—not a direct assessment.</p>
        {telemetrySummary.termConsultations.uniqueTerms.length > 0 && (
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Terms: <FinancialText text={telemetrySummary.termConsultations.uniqueTerms.join(', ')} />
          </p>
        )}
        <div className="mt-5 border-t border-slate-700 pt-4">
          <h4 className="font-semibold">Questions to discuss with the advisor</h4>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
            {advisorQuestions.map((question) => <li key={question}>{question}</li>)}
          </ol>
        </div>
        <button type="button" onClick={copyTelemetry} className="mt-5 min-h-11 w-full rounded-xl border border-indigo-400/40 bg-indigo-500/10 px-4 text-sm font-semibold text-indigo-200 hover:bg-indigo-500/20">
          {telemetryCopied ? 'Telemetry JSON copied' : 'Copy telemetry JSON'}
        </button>
        {telemetryCopied && <p role="status" className="mt-2 text-sm text-emerald-300">Session telemetry copied to the clipboard.</p>}
        {telemetryCopyError && <p role="alert" className="mt-2 text-sm text-rose-300">{telemetryCopyError}</p>}
        <p className="mt-3 text-xs text-slate-400">
          Calibration suggestion: {telemetrySummary.shouldSuggestCalibration ? 'Recommended' : 'Not triggered'}
        </p>
      </section>
    </div>
  );
  return (
    <main className="session-page min-h-dvh bg-[#171827] text-white pb-24">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 pt-6">
        <div className="grid w-full max-w-3xl grid-cols-2 rounded-xl border border-slate-700 bg-slate-900 p-1">
          {(['plan', 'advisor'] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={tab === item}
                onClick={() => {
                  if (tab === item) return;
                  setTab(item);
                  document.getElementById('app-content')?.scrollTo({ top: 0, behavior: 'instant' });
                }}
              className={`min-h-11 rounded-lg text-sm font-semibold transition-all ${tab === item ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
            >
              {item === 'plan' ? 'Client Action Plan' : 'Advisor Telemetry & Pre-Meeting'}
            </button>
          ))}
        </div>
      </div>
      <div className="w-full max-w-3xl mx-auto min-h-full flex flex-col pb-8">
        {tab === 'plan' ? plan : advisor}
      </div>

      {/* ── Fixed Bottom Mode Switcher Bar ──────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md py-3 px-4 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (tab === 'plan') return;
              setTab('plan');
              document.getElementById('app-content')?.scrollTo({ top: 0, behavior: 'instant' });
            }}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              tab === 'plan'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Client Action Plan</span>
          </button>

          <Link
            to={`/case/${activeCase.id}/advisor`}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-indigo-500/30"
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Advisor Telemetry Mode →</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
