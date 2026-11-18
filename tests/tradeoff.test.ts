import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultTradeoffGoals, getTradeoffGoals, savedTradeoff, tradeoffWeights } from '../src/lib/tradeoff';
import michael from '../cases/michael-carter/financial-health.json';
import samantha from '../cases/samantha-lewis/financial-health.json';
import type { FinancialHealth, TelemetryEvent } from '../src/types';

test('goals and dates come from each household case', () => {
  const m = getTradeoffGoals(michael as FinancialHealth);
  assert(m.some(g => g.label.includes('$550,000') && g.dates.some(d => d.date.startsWith('2027'))));
  assert(m.some(g => g.label === "Michael's Retirement" && g.dates[0].date.startsWith('2047')));
  const s = getTradeoffGoals(samantha as FinancialHealth);
  assert(s.some(g => g.label.includes('$500,000') && g.dates.some(d => d.date.startsWith('2030'))));
  assert(s.some(g => g.label.includes('$50,000') && g.dates.some(d => d.name === 'College Ava')));
  assert.deepEqual(defaultTradeoffGoals(m).map(goal => goal?.type), ['REAL_ESTATE_PURCHASE', 'RETIREMENT']);
  assert.deepEqual(defaultTradeoffGoals(s).map(goal => goal?.type), ['COLLEGE', 'REAL_ESTATE_PURCHASE']);
});

test('weights and saved choices are scoped and validated', () => {
  assert.deepEqual(tradeoffWeights(2, 5), { weightA: 29, weightB: 71, choice: 'B' });
  const goals = getTradeoffGoals(michael as FinancialHealth);
  const event = (caseId: string, starsA: number): TelemetryEvent => ({ type: 'allocation_set', timestamp: 1, payload: { caseId, goalAId: goals[0].id, goalBId: goals[1].id, starsA, starsB: 5 } });
  assert.equal(savedTradeoff([event('other', 3), event('m', 2)], 'm', goals)?.starsA, 2);
  assert.equal(savedTradeoff([event('m', 6)], 'm', goals), null);
});
