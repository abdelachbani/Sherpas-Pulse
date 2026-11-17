import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractWhatIfScenarios } from '../lib/mcp/extractor';
import { formatSessionHandoff } from '../lib/sessionHandoff';
import { SplitScreenToggle, SplitScreenContainer, type SplitMode } from '../components/shared/SplitScreenToggle';
import { FinancialText } from '../components/shared/FinancialText';

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
  const getTelemetrySummary = useAppStore((s) => s.getTelemetrySummary);
  const telemetrySummary = getTelemetrySummary();
  const checkboxPrefix = useId();
  const activeCase = (currentCase?.id === caseId ? currentCase : CASES.find((c) => c.id === caseId))!;
  const [done, setDone] = useState<number[]>([]);
  const [mode, setMode] = useState<SplitMode>('single');
  const [tab, setTab] = useState<'plan' | 'advisor'>('plan');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copied, setCopied] = useState(false);
  useEffect(() => { if (caseId && currentCase?.id !== caseId) setCase(caseId); }, [caseId, currentCase, setCase]);

  const members = activeCase.financialHealth.case.household.filter((person) => person.role === 'client' || person.role === 'co-client');
  const names = members.map((person) => person.first_name).join(' & ');
  const moves = activeCase.financialHealth.score.top_moves;
  const matchingCase = currentCase?.id === caseId;
  const handoff = formatSessionHandoff(activeCase.id, matchingCase ? events : [], matchingCase ? allocations : { primary: null, secondary: null }, extractWhatIfScenarios(activeCase.financialHealth, activeCase.investmentAnalysis));
  const message = `${channel === 'email' ? `Subject: Plan priorities for ${names}\n\n` : ''}Here are the recommendations I would like to discuss:\n\n${moves.map((move, index) => `${index + 1}. ${move.title}: ${move.action}`).join('\n')}${handoff ? `\n\n${handoff}` : ''}\n\nLet's review the next steps together.`;
  const plan = <div className="p-5 sm:p-7 space-y-6 text-white">
    <header><p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Your next steps</p><h1 className="mt-2 text-3xl font-semibold">{names}’s action plan</h1><p className="mt-3 text-sm leading-relaxed text-slate-300">Review the recommendations from your plan and mark the steps you have completed.</p></header>
    <section className="space-y-3"><div className="flex justify-between gap-3"><h2 className="text-lg font-semibold">Plan recommendations</h2><span className="text-sm text-slate-400">{done.length} / {moves.length} complete</span></div>
      {moves.length === 0 && <p className="text-sm text-slate-300">No recommendations are available for this plan.</p>}
      {moves.map((move, index) => <article key={`${move.title}-${index}`} className="rounded-2xl border border-slate-700 bg-slate-900 p-4 sm:p-5"><div className="flex items-start gap-3"><input id={`${checkboxPrefix}-move-${index}`} type="checkbox" aria-label={`Mark recommendation ${index + 1} complete`} checked={done.includes(index)} onChange={() => setDone((previous) => previous.includes(index) ? previous.filter((i) => i !== index) : [...previous, index])} className="mt-1 h-5 w-5 accent-indigo-500" /><div><h3 className="font-semibold text-white"><FinancialText text={move.title} /></h3><p className="mt-2 text-sm leading-relaxed text-slate-300"><FinancialText text={move.action} /></p></div></div></article>)}
    </section>
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold">Share your priorities</h2><p className="mt-2 text-sm text-slate-300">Copy a draft to discuss with your advisor or family.</p><div className="mt-4 flex gap-2">{(['whatsapp', 'email'] as const).map((item) => <button key={item} type="button" aria-pressed={channel === item} onClick={() => { setChannel(item); setCopied(false); }} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${channel === item ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{item === 'email' ? 'Email' : 'WhatsApp'}</button>)}</div><div className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-300"><FinancialText text={message} /></div><button type="button" onClick={async () => { await navigator.clipboard.writeText(message); setCopied(true); }} className="mt-4 min-h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500">{copied ? 'Copied' : 'Copy draft'}</button></section>
    <button type="button" onClick={() => { resetStore(); navigate('/'); }} className="min-h-11 w-full rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-200">Start a new household session</button>
  </div>;
  const advisor = (
    <div className="p-5 sm:p-7 space-y-5 text-white">
      <header>
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Meeting preparation</p>
        <h2 className="mt-2 text-2xl font-semibold">Discussion overview</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">Use the plan recommendations and saved priorities to guide your conversation.</p>
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
        </dl>
        {telemetrySummary.termConsultations.uniqueTerms.length > 0 && (
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Terms: <FinancialText text={telemetrySummary.termConsultations.uniqueTerms.join(', ')} />
          </p>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Calibration suggestion: {telemetrySummary.shouldSuggestCalibration ? 'Recommended' : 'Not triggered'}
        </p>
      </section>
    </div>
  );
  return <main className="session-page min-h-dvh bg-[#171827] text-white"><div className="mx-auto flex max-w-4xl flex-col items-center gap-3 px-4 pt-6"><SplitScreenToggle mode={mode} onModeChange={setMode} showTargetSelector={false} />{mode === 'single' && <div className="grid w-full max-w-3xl grid-cols-2 rounded-xl border border-slate-700 bg-slate-900 p-1">{(['plan', 'advisor'] as const).map((item) => <button key={item} type="button" aria-pressed={tab === item} onClick={() => setTab(item)} className={`min-h-11 rounded-lg text-sm font-semibold ${tab === item ? 'bg-indigo-600' : 'text-slate-300'}`}>{item === 'plan' ? 'Action plan' : 'Discussion overview'}</button>)}</div>}</div><SplitScreenContainer mode={mode} leftTitle="Action plan" leftSubtitle="Plan recommendations" leftContent={plan} rightTitle="Discussion overview" rightSubtitle="Meeting preparation" rightContent={advisor} singleActiveTab={tab === 'plan' ? 'left' : 'right'} className="pb-8" /></main>;
}
