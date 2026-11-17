import type { CashStrategyOption, CoupleAllocation } from '../types';

export function restoreAllocationOrder(options: CashStrategyOption[], saved: CoupleAllocation | null): CashStrategyOption[] {
  const ranks = new Map(saved?.allocations.map((item) => [item.strategyId, item.priority]) ?? []);
  return [...options].sort((a, b) => (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity));
}
