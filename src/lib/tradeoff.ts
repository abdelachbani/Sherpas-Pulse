import type { FinancialHealth, TelemetryEvent } from '../types';

export interface TradeoffGoal {
  id: string;
  label: string;
  type: string;
  dates: { name: string; date: string; termDate?: string }[];
}

/** Use only documented goals; chart dates are shown as source dates, not forecasts. */
export function getTradeoffGoals(fh: FinancialHealth): TradeoffGoal[] {
  const summaries = fh.goals?.goalsSummary ?? [];
  const chart = fh.goals?.chartGoals ?? [];
  const goals = summaries.map((goal, index) => ({
    id: `summary-${index}`,
    label: goal.value,
    type: goal.subType === 'REAL_ESTATE_PURCHASE' ? goal.subType : goal.goalType,
    dates: chart.filter(item => item.goalType === goal.goalType && (!goal.subType || item.subType === goal.subType))
      .map(item => ({ name: item.name, date: item.date, termDate: item.termDate })),
  }));
  chart.forEach((item, index) => {
    if (item.goalType === 'RETIREMENT') goals.push({
      id: `chart-${index}`, label: item.name,
      type: item.goalType,
      dates: [{ name: item.name, date: item.date, termDate: item.termDate }],
    });
  });
  return goals;
}

export function defaultTradeoffGoals(goals: TradeoffGoal[]) {
  const home = goals.find(goal => goal.type === 'REAL_ESTATE_PURCHASE');
  const college = goals.find(goal => goal.type === 'COLLEGE');
  const retirement = goals.find(goal => goal.type === 'RETIREMENT');
  const first = (home && college ? college : home) ?? goals[0];
  const second = (home && college ? home : retirement) ?? goals.find(goal => goal !== first);
  return [first, second === first ? goals.find(goal => goal !== first) : second];
}

export function tradeoffWeights(a: number, b: number) {
  const weightA = Math.round(a / (a + b) * 100);
  return { weightA, weightB: 100 - weightA, choice: a === b ? 'balanced' : a > b ? 'A' : 'B' };
}

export function savedTradeoff(events: TelemetryEvent[], caseId: string, goals: TradeoffGoal[]) {
  const event = [...events].reverse().find(e => e.type === 'allocation_set' && e.payload.caseId === caseId && typeof e.payload.goalAId === 'string' && typeof e.payload.goalBId === 'string');
  const p = event?.payload;
  if (!p || !goals.some(g => g.id === p.goalAId) || !goals.some(g => g.id === p.goalBId) || p.goalAId === p.goalBId || typeof p.starsA !== 'number' || typeof p.starsB !== 'number' || !Number.isInteger(p.starsA) || !Number.isInteger(p.starsB) || p.starsA < 1 || p.starsA > 5 || p.starsB < 1 || p.starsB > 5) return null;
  return { goalAId: p.goalAId as string, goalBId: p.goalBId as string, starsA: p.starsA, starsB: p.starsB };
}
