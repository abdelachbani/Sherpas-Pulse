/**
 * src/components/couple/CashAllocatorChip.tsx
 *
 * Draggable & prioritizable strategy chip for the Tactile Cash Allocator.
 * Shows title, target dollar amount, benefit summary from MCP, and drag handle.
 */

import { ArrowUp, ArrowDown } from 'lucide-react';
import type { CashStrategyOption } from '../../types';
import { FinancialText } from '../shared/FinancialText';

interface Props {
  strategy: CashStrategyOption;
  priorityIndex: number;
  allocatedAmount?: number;
  totalAvailable?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onInspect?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function CashAllocatorChip({
  strategy,
  priorityIndex,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: Props) {
  const urgencyColors = {
    critical: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
    moderate: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    optional: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
  };

  return (
    <div
      className={`p-4 rounded-2xl border bg-slate-900/90  ${urgencyColors[strategy.urgency]}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Priority Rank & Title */}
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/20 shrink-0">
            #{priorityIndex + 1}
          </span>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight">
              <FinancialText text={strategy.label} />
            </h3>
            <span className="text-xs uppercase font-semibold tracking-wider opacity-80 block">
              {strategy.urgency} Priority
            </span>
          </div>
        </div>

        {/* Up / Down Priority Reordering Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className={`min-w-11 min-h-11 flex items-center justify-center rounded-lg ${isFirst ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
            aria-label="Move priority up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className={`min-w-11 min-h-11 flex items-center justify-center rounded-lg ${isLast ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
            aria-label="Move priority down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-sm text-slate-300 mt-1 leading-relaxed bg-black/20 p-2 rounded-xl">
        <FinancialText text={strategy.benefitSummary} />
      </p>
      {strategy.quantities && <dl className="mt-2 divide-y divide-slate-700 text-sm">
        {strategy.quantities.map(({ label, amount }) => <div key={label} className="flex justify-between gap-2 py-1.5 text-slate-200">
          <dt>{label}</dt><dd className="shrink-0 font-semibold tabular-nums text-white">${amount.toLocaleString('en-US')}</dd>
        </div>)}
      </dl>}
    </div>
  );
}
