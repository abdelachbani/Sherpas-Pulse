import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Star } from 'lucide-react';
import { CASES } from '../lib/mcp/cases';
import { defaultTradeoffGoals, getTradeoffGoals, savedTradeoff, tradeoffWeights } from '../lib/tradeoff';
import { useAppStore } from '../stores/appStore';
import type { CaseData } from '../types';

export default function TradeoffPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const household = CASES.find(item => item.id === caseId);
  if (!household) return <main className="session-page min-h-dvh p-8 text-white"><h1>Household not found</h1><a href="/">Choose a household</a></main>;
  if (household.householdType !== 'single') return <main className="session-page min-h-dvh p-8 text-white"><h1>Trade-off is available for single households</h1><a className="underline" href={`/case/${household.id}/stories`}>Return to stories</a></main>;
  return <TradeoffContent key={household.id} household={household} />;
}

function TradeoffContent({ household }: { household: CaseData }) {
  const navigate = useNavigate();
  const currentCase = useAppStore(s => s.currentCase);
  const setCase = useAppStore(s => s.setCase);
  const events = useAppStore(s => s.telemetryEvents);
  const addEvent = useAppStore(s => s.addTelemetryEvent);
  const track = useAppStore(s => s.trackTradeoffChange);
  const goals = useMemo(() => getTradeoffGoals(household.financialHealth), [household]);
  useEffect(() => { if (currentCase?.id !== household.id) setCase(household.id); }, [currentCase, household.id, setCase]);
  if (currentCase?.id !== household.id) return <main className="session-page min-h-dvh p-8 text-white">Loading household…</main>;
  return <TradeoffEditor household={household} goals={goals} events={events} addEvent={addEvent} track={track} navigate={navigate} />;
}

function TradeoffEditor({ household, goals, events, addEvent, track, navigate }: {
  household: CaseData; goals: ReturnType<typeof getTradeoffGoals>;
  events: ReturnType<typeof useAppStore.getState>['telemetryEvents'];
  addEvent: ReturnType<typeof useAppStore.getState>['addTelemetryEvent'];
  track: ReturnType<typeof useAppStore.getState>['trackTradeoffChange'];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [saved] = useState(() => savedTradeoff(events, household.id, goals));
  const [firstGoal, secondGoal] = defaultTradeoffGoals(goals);
  const [goalAId, setGoalAId] = useState(saved?.goalAId ?? firstGoal?.id ?? '');
  const [goalBId, setGoalBId] = useState(saved?.goalBId ?? secondGoal?.id ?? '');
  const [starsA, setStarsA] = useState(saved?.starsA ?? 3);
  const [starsB, setStarsB] = useState(saved?.starsB ?? 3);
  const a = goals.find(g => g.id === goalAId);
  const b = goals.find(g => g.id === goalBId);
  const { weightA, weightB, choice } = tradeoffWeights(starsA, starsB);
  const options = [
    { option: 'A' as const, goal: a, id: goalAId, stars: starsA, weight: weightA },
    { option: 'B' as const, goal: b, id: goalBId, stars: starsB, weight: weightB },
  ];
  const ranked = [...options].sort((first, second) => second.stars - first.stars);
  function changeGoal(option: 'A' | 'B', id: string) {
    if (option === 'A') { if (id === goalBId) setGoalBId(goalAId); setGoalAId(id); }
    else { if (id === goalAId) setGoalAId(goalBId); setGoalBId(id); }
    track({ action: 'goal_select', option, goalId: id, caseId: household.id }, 'tradeoff');
  }
  function changeStars(option: 'A' | 'B', value: number) {
    if (option === 'A') setStarsA(value); else setStarsB(value);
    track({ action: 'priority_change', option, value, caseId: household.id }, 'tradeoff');
  }
  function save() {
    if (!a || !b) return;
    addEvent({ type: 'allocation_set', payload: { caseId: household.id, scenarioId: 'documented-goals', goalAId, goalBId, labelA: a.label, labelB: b.label, choice, starsA, starsB, weightA, weightB }, timestamp: Date.now() });
    navigate(`/case/${household.id}/action`);
  }
  return <main className="session-page min-h-dvh bg-[#171827] text-white max-w-3xl mx-auto p-5 space-y-6">
    <button onClick={() => navigate(`/case/${household.id}/stories`)} className="inline-flex items-center gap-2 text-slate-300"><ArrowLeft size={16} /> Stories</button>
    <header><p className="text-sm text-indigo-300">Your goals</p><h1 className="text-3xl font-bold mt-2">Choose what matters most</h1><p className="text-slate-300 mt-3">Compare two documented goals and rate their importance. Your ratings express preference; they do not calculate affordability or predict outcomes.</p></header>
    {goals.length < 2 ? <p>There are fewer than two documented goals to compare.</p> : <>
      {options.map(({ option, goal, id, stars, weight }) => <section key={option} className="p-5 rounded-2xl bg-[#202237] border border-slate-700 space-y-3">
        <label className="block font-semibold" htmlFor={`goal-${option}`}>Goal {option}</label>
        <select id={`goal-${option}`} value={id} onChange={e => changeGoal(option, e.target.value)} className="w-full p-3 rounded-lg bg-slate-900 text-white">{goals.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}</select>
        <p className="text-xs text-slate-400">Source: financial-health.json, {id.startsWith('summary-') ? `goals.goalsSummary[${id.slice(8)}].value` : `goals.chartGoals[${id.slice(6)}].name`}</p>
        {goal?.dates.length ? <ul className="text-sm text-slate-300 space-y-1">{goal.dates.map((d, i) => <li key={i}>{d.name}: {d.date.slice(0, 10)}{d.termDate ? ` · term date: ${d.termDate.slice(0, 10)}` : ''} <span className="text-slate-400">(source: chartGoals)</span></li>)}</ul> : <p className="text-sm text-slate-400">No date documented in chart goals.</p>}
        <p className="text-sm">Importance: {stars} / 5 · Relative weight: {weight}%</p>
        <div role="group" aria-label={`Importance of goal ${option}`} className="grid max-w-70 grid-cols-5 gap-0.5">
          {[1, 2, 3, 4, 5].map(rating => <button key={rating} type="button" aria-label={`Rate option ${option} ${rating} out of 5`} aria-pressed={stars === rating} onClick={() => changeStars(option, rating)} className="grid min-h-11 place-items-center rounded-lg text-indigo-200 hover:bg-slate-700">
            <Star aria-hidden="true" size={19} fill={rating <= stars ? 'currentColor' : 'none'} />
          </button>)}
        </div>
      </section>)}
      <section className="p-5 rounded-2xl border border-slate-700">
        <h2 className="font-semibold">Priority ranking</h2>
        <ol data-priority-order aria-label="Current priority order" aria-live="polite" className="mt-2 divide-y divide-slate-700 text-sm text-slate-300">
          {ranked.map(({ option, goal, weight }, index) => <li key={option} data-option={option} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-3 py-2">
            <span className="font-semibold text-indigo-200">{choice === 'balanced' ? 'Tie' : index + 1}</span><span>{goal?.label}</span><span>{weight}%</span>
          </li>)}
        </ol>
        <p className="text-xs text-slate-400 mt-2">Weights show each rating’s share of the total rating.</p>
      </section>
      <button onClick={save} className="w-full py-4 rounded-2xl bg-[#4565d6] font-semibold flex justify-center items-center gap-2">Save and continue to action plan <ChevronRight size={18} /></button>
    </>}
  </main>;
}
