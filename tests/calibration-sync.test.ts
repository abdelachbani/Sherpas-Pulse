import assert from 'node:assert/strict';
import { CASES } from '../src/lib/mcp/cases';
import { extractCalibrationCards, extractHouseholdSync } from '../src/lib/mcp/extractor';

for (const item of CASES) {
  const cards = extractCalibrationCards(item.financialHealth, item.investmentAnalysis);
  for (const key of ['roth-ira', 'umbrella-liability', 'revolving-apr', 'mortality-ratio', '529-plan', 'leveraged-etf', 'withdrawal-rate']) {
    assert(cards[key]);
    assert(!/Liam|Josh|Timothy|Melanie|\$3,240|\$235,000|guaranteed/i.test(JSON.stringify(cards[key])));
    for (const ref of cards[key].groundingRefs) {
      const value = ref.jsonPath.replace(/\[(\d+)\]/g, '.$1').split('.').reduce<any>((v, k) => v?.[k], item.financialHealth);
      assert.equal(value, ref.rawValue);
    }
  }
}
assert.deepEqual(extractHouseholdSync('any', null, null), { agreements: [], tieBreakers: [] });
const a = { partner: 'Alex', allocations: [{ strategyId: 'goal', label: 'Goal', amount: 500, priority: 1 }] };
const b = { partner: 'Sam', allocations: [{ strategyId: 'goal', label: 'Goal', amount: 700, priority: 2 }] };
assert.deepEqual(extractHouseholdSync('any', a, null), { agreements: [], tieBreakers: [] });
const result = extractHouseholdSync('any', a, b);
assert.equal(result.agreements.length, 0);
assert.equal(result.tieBreakers.length, 1);
assert.deepEqual([result.tieBreakers[0].partner1Name, result.tieBreakers[0].partner1Amount, result.tieBreakers[0].partner1Priority, result.tieBreakers[0].partner2Name, result.tieBreakers[0].partner2Amount, result.tieBreakers[0].partner2Priority], ['Alex', 500, 1, 'Sam', 700, 2]);
const agreed = extractHouseholdSync('any', a, { ...b, allocations: [{ ...b.allocations[0], amount: 500, priority: 1 }] });
assert.equal(agreed.agreements[0].agreedAmount, 500);
assert.equal(agreed.tieBreakers.length, 0);
