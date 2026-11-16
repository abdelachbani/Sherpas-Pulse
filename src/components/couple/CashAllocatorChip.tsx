/**
 * src/components/couple/CashAllocatorChip.tsx
 *
 * Draggable & prioritizable strategy chip for the Tactile Cash Allocator.
 * Shows title, target dollar amount, benefit summary from MCP, and drag handle.
 */

import { motion } from 'framer-motion';
import { GripVertical, ShieldCheck, ArrowUp, ArrowDown, Info } from 'lucide-react';
import type { CashStrategyOption } from '../../types';

interface Props {
  strategy: CashStrategyOption;
  priorityIndex: number;
  allocatedAmount: number;
  totalAvailable: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onInspect?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function CashAllocatorChip({
  strategy,
  priorityIndex,
  allocatedAmount,
  totalAvailable,
  onMoveUp,
  onMoveDown,
  onInspect,
  isFirst,
  isLast,
}: Props) {
  const urgencyColors = {
    critical: 'border-rose-500/40 bg-rose-950/20 text-rose-300',
    moderate: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
    optional: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
      className={`p-4 rounded-2xl border bg-slate-900/90 shadow-md ${urgencyColors[strategy.urgency]}`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Priority Rank & Title */}
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white font-bold text-xs flex items-center justify-center border border-white/20 shrink-0">
            #{priorityIndex + 1}
          </span>
          <div>
            <h3 className="font-bold text-white text-sm tracking-tight">{strategy.label}</h3>
            <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80 block">
              {strategy.urgency} Priority
            </span>
          </div>
        </div>

        {/* Up / Down Priority Reordering Buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 rounded-xl p-1 border border-slate-700 shrink-0">
          <button
            onClick={onMoveUp}
            disabled={isFirst}
            className={`p-1 rounded-lg ${isFirst ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
            aria-label="Move priority up"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={isLast}
            className={`p-1 rounded-lg ${isLast ? 'text-slate-600' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
            aria-label="Move priority down"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Target Amount & Benefit */}
      <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-white/10 text-xs">
        <span className="text-slate-300 text-xs font-semibold">Allocated Target:</span>
        <span className="text-base font-black text-white">
          ${strategy.amount.toLocaleString()}
        </span>
      </div>

      <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-black/20 p-2 rounded-xl">
        {strategy.benefitSummary}
      </p>

      {/* Grounding Info trigger */}
      {strategy.grounding && (
        <button
          onClick={onInspect}
          className="mt-2.5 flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified in MCP plan</span>
        </button>
      )}
    </motion.div>
  );
}
