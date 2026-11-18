import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/lib/mcp/cases';
import { extractCashAllocationOptions } from '../src/lib/mcp/extractor';

test('priority recommendations and quantities come from the published case actions', () => {
  for (const household of CASES) {
    const moves = household.financialHealth.score.top_moves;
    const options = extractCashAllocationOptions(household.financialHealth);
    assert.deepEqual(options.map(o => [o.label, o.benefitSummary]), moves.map(m => [m.title, m.action]));
    assert.deepEqual(options.map(o => o.grounding?.rawValue), moves.map(m => m.action));
  }
});

test('existing couple priority IDs remain stable for persisted ordering', () => {
  assert.deepEqual(extractCashAllocationOptions(CASES[0].financialHealth).map(o => o.id), ['card-payoff', 'life-insurance', 'umbrella-cover']);
  assert.deepEqual(extractCashAllocationOptions(CASES[1].financialHealth).map(o => o.id), ['life-coverage', 'umbrella-cover', 'savings-boost']);
});
