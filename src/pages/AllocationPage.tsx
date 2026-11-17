/**
 * src/pages/AllocationPage.tsx
 *
 * Your priorities ("Advice Tank"):
 *  - Responsive vertical mobile design with scrollable strategies list (zero overlap)
 *  - Each partner drags and orders strategies competing for their cash
 *  - Real-time liquidity tank level drainage
 *  - Saves allocations per partner into appStore
 *  - Supports one-click demo simulation of Partner 2 for live stage presentation
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  Check,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractCashAllocationOptions } from '../lib/mcp/extractor';
import { CashAllocatorChip } from '../components/couple/CashAllocatorChip';
import { GroundingInspector } from '../components/calibration/GroundingInspector';
import type { CashStrategyOption, GroundingRef, CoupleAllocation } from '../types';

export default function AllocationPage() {
  const { caseId } = useParams<{ caseId: string }>();
  if (!CASES.some((item) => item.id === caseId)) {
    return <main className="session-page min-h-dvh bg-[#171827] text-white p-8"><div className="max-w-3xl mx-auto"><h1 className="text-2xl font-semibold">Household not found</h1><p className="mt-3 text-sm text-slate-300">This household link is unavailable. Choose a household to continue.</p><a className="inline-flex min-h-11 items-center mt-6 text-indigo-300 underline" href="/">Choose a household</a></div></main>;
  }
  return <AllocationPageContent key={caseId} />;
}

function AllocationPageContent() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const partner = useAppStore((s) => s.partner) || 'primary';
  const setAllocation = useAppStore((s) => s.setAllocation);
  const trackAllocationChange = useAppStore((s) => s.trackAllocationChange);

  const activeCase = (currentCase?.id === caseId ? currentCase : CASES.find((c) => c.id === caseId))!;

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  const rawOptions = extractCashAllocationOptions(activeCase.financialHealth);

  const [strategies, setStrategies] = useState<CashStrategyOption[]>(rawOptions);
  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);
  const [hasLockedIn, setHasLockedIn] = useState(false);

  const client = activeCase.financialHealth.case.household.find((m) => m.role === 'client');
  const coClient = activeCase.financialHealth.case.household.find((m) => m.role === 'co-client');

  const currentPartnerName =
    partner === 'primary' ? client?.first_name || 'Timothy' : coClient?.first_name || 'Melanie';
  const otherPartnerName =
    partner === 'primary' ? coClient?.first_name || 'Melanie' : client?.first_name || 'Timothy';

  // Total cash numbers
  const surplusCash = 60222;

  // Sum top 2 prioritized strategy amounts
  const allocatedAmount = strategies
    .slice(0, 2)
    .reduce((sum, s) => sum + (s.id === 'umbrella-cover' ? 300 : s.amount), 0);

  function moveStrategy(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= strategies.length) return;
    const copy = [...strategies];
    const [moved] = copy.splice(fromIdx, 1);
    if (!moved) return;
    copy.splice(toIdx, 0, moved);
    setStrategies(copy);
    trackAllocationChange({
      action: 'reorder',
      partner,
      strategyId: moved.id,
      fromPriority: fromIdx + 1,
      toPriority: toIdx + 1,
      caseId: activeCase.id,
    }, 'allocation');
  }

  function handleLockIn() {
    const alloc: CoupleAllocation = {
      partner: currentPartnerName,
      allocations: strategies.map((s, idx) => ({
        strategyId: s.id,
        label: s.label,
        amount: s.amount,
        priority: idx + 1,
      })),
    };

    setAllocation(partner, alloc);
    setHasLockedIn(true);

    trackAllocationChange({
      action: 'lock_in',
      partner: currentPartnerName,
      allocations: alloc.allocations,
      caseId: activeCase.id,
    }, 'allocation');
  }

  function handleSimulatePartner2() {
    const melanieOrder = ['card-payoff', 'life-insurance', 'umbrella-cover', 'college-529'];
    const sorted = [...rawOptions].sort(
      (a, b) => melanieOrder.indexOf(a.id) - melanieOrder.indexOf(b.id)
    );

    const partner2Alloc: CoupleAllocation = {
      partner: otherPartnerName,
      allocations: sorted.map((s, idx) => ({
        strategyId: s.id,
        label: s.label,
        amount: s.amount,
        priority: idx + 1,
      })),
    };

    const targetPartner = partner === 'primary' ? 'secondary' : 'primary';
    setAllocation(targetPartner, partner2Alloc);
    trackAllocationChange({
      action: 'partner_simulated',
      partner: otherPartnerName,
      allocations: partner2Alloc.allocations,
      caseId: activeCase.id,
    }, 'allocation');

    navigate(`/case/${activeCase.id}/sync`);
  }

  return (
    <div className="session-page min-h-dvh bg-[#171827] text-white max-w-3xl mx-auto p-5 sm:p-8 flex flex-col gap-6 relative">
      {/* ── Top Header (Shrink-0) ────────────────────────────────────────────── */}
      <div className="shrink-0 pt-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>Your priorities</span>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              partner === 'primary'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
            }`}
          >
            {currentPartnerName}’s Turn
          </span>
        </div>

        <h1 className="text-xl font-semibold tracking-tight text-white mt-3 leading-tight">
          Order your priorities
        </h1>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
          Use the arrows to choose which recommendations matter most to you.
        </p>
      </div>

      {/* ── Strategies Scroll Area (Scrollable with max height to avoid crushing) ── */}
      <div className="flex-1 my-2 space-y-3">
        <AnimatePresence>
          {strategies.map((strategy, idx) => (
            <CashAllocatorChip
              key={strategy.id}
              strategy={strategy}
              priorityIndex={idx}
              allocatedAmount={allocatedAmount}
              totalAvailable={surplusCash}
              onMoveUp={() => moveStrategy(idx, idx - 1)}
              onMoveDown={() => moveStrategy(idx, idx + 1)}
              isFirst={idx === 0}
              isLast={idx === strategies.length - 1}
              onInspect={() => strategy.grounding && setActiveGrounding(strategy.grounding)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Liquidity Tank Summary (Shrink-0 at bottom) ────────────────────── */}
      <div className="shrink-0 space-y-2.5 pt-1 border-t border-slate-700/70 bg-[#171827]">
        <p className="text-sm leading-relaxed text-slate-300">This exercise orders your priorities. It does not calculate an available budget or confirm affordability.</p>

        {/* Lock-in action or Simulate Partner 2 modal */}
        {!hasLockedIn ? (
          <button
            onClick={handleLockIn}
            className="w-full py-3 rounded-2xl bg-[#4565d6] hover:bg-[#6380ff] text-white font-bold text-xs shadow-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Lock In {currentPartnerName}’s Priorities</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-2">
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{currentPartnerName}’s priorities are locked!</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Now {otherPartnerName} can order priorities on their phone, or you can simulate their choices for the demo.
            </p>

            <button
              onClick={handleSimulatePartner2}
              className="w-full py-2.5 rounded-xl bg-[#4565d6] hover:bg-[#6380ff] text-white font-bold text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate {otherPartnerName}’s Turn & See Consensus →</span>
            </button>
          </div>
        )}
      </div>

      {/* Grounding Inspector */}
      <GroundingInspector
        grounding={activeGrounding}
        onClose={() => setActiveGrounding(null)}
      />
    </div>
  );
}
