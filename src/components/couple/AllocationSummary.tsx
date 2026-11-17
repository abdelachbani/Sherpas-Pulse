/**
 * src/components/couple/AllocationSummary.tsx
 *
 * Visual liquidity tank indicator:
 *  - Displays available cash reservoir ($150,000 total / $60,222 surplus)
 *  - Real-time animated liquid drain as strategies are allocated
 *  - Dynamic warning if exceeding emergency reserve limit
 */

import { motion } from 'framer-motion';
import { Droplets, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  totalCash: number;
  surplusCash: number;
  allocatedAmount: number;
}

export function AllocationSummary({ totalCash, surplusCash, allocatedAmount }: Props) {
  const remainingSurplus = Math.max(0, surplusCash - allocatedAmount);
  const percentUsed = Math.min(100, Math.round((allocatedAmount / surplusCash) * 100));

  const isWithinSurplus = allocatedAmount <= surplusCash;
  const isOverSurplus = allocatedAmount > surplusCash;

  const tankColor = isWithinSurplus
    ? 'bg-blue-500'
    : 'bg-amber-500';

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-4  space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-blue-400 font-bold">
          <Droplets className="w-4 h-4" />
          <span>Surplus Cash Tank</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Liquid Cash</span>
          <span className="text-xs font-bold text-white">${totalCash.toLocaleString()}</span>
        </div>
      </div>

      {/* Tank fill bar */}
      <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
        <motion.div
          className={`h-full rounded-full ${tankColor} transition-all duration-300`}
          style={{ width: `${percentUsed}%` }}
        />
      </div>

      {/* Metrics breakdown */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div>
          <span className="text-[10px] text-slate-400 block">Allocated to Date</span>
          <span className="font-bold text-white">${allocatedAmount.toLocaleString()}</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">Surplus Available</span>
          <span className={`font-bold ${isWithinSurplus ? 'text-emerald-400' : 'text-rose-400'}`}>
            ${remainingSurplus.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Safety status pill */}
      <div className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
        {isWithinSurplus ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Emergency reserve ($90k) safely protected.</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Exceeds surplus cash — will draw into core safety reserve.</span>
          </>
        )}
      </div>
    </div>
  );
}
