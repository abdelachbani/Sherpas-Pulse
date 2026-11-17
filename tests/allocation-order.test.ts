import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreAllocationOrder } from '../src/lib/allocationOrder';
import type { CashStrategyOption, CoupleAllocation } from '../src/types';

const options: CashStrategyOption[] = ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id, amount: 1, urgency: 'optional', benefitSummary: '' }));

test('restores saved ranks, including zero, with stable ties and unranked options last', () => {
  const saved: CoupleAllocation = { partner: 'Alex', allocations: [
    { strategyId: 'c', label: 'c', amount: 1, priority: 2 },
    { strategyId: 'a', label: 'a', amount: 1, priority: 2 },
    { strategyId: 'd', label: 'd', amount: 1, priority: 0 },
  ] };
  assert.deepEqual(restoreAllocationOrder(options, saved).map((item) => item.id), ['d', 'a', 'c', 'b']);
});
