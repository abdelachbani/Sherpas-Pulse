/**
 * src/pages/AllocationPage.tsx
 *
 * Tactile Cash Allocator ("Advice Tank"):
 *  - Each partner drags and orders strategies competing for their cash
 *  - Real-time liquidity tank level drainage
 *  - Saves allocations per partner into appStore
 *  - Supports one-click demo simulation of Partner 2 for live stage presentation
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Check,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractCashAllocationOptions } from '../lib/mcp/extractor';
import { CashAllocatorChip } from '../components/couple/CashAllocatorChip';
import { AllocationSummary } from '../components/couple/AllocationSummary';
import { GroundingInspector } from '../components/calibration/GroundingInspector';
import type { CashStrategyOption, GroundingRef, CoupleAllocation } from '../types';

export default function AllocationPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const partner = useAppStore((s) => s.partner) || 'primary';
  const setAllocation = useAppStore((s) => s.setAllocation);
  const coupleAllocations = useAppStore((s) => s.coupleAllocations);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  const activeCase = currentCase ?? CASES.find((c) => c.id === caseId) ?? CASES[0];

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
  const totalCash = 150000;
  const surplusCash = 60222;

  // Sum top 2 prioritized strategy amounts
  const allocatedAmount = strategies
    .slice(0, 2)
    .reduce((sum, s) => sum + (s.id === 'umbrella-cover' ? 300 : s.amount), 0);

  function moveStrategy(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= strategies.length) return;
    const copy = [...strategies];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setStrategies(copy);
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

    addTelemetryEvent({
      type: 'allocation_set',
      payload: { partner: currentPartnerName, allocations: alloc.allocations },
      timestamp: Date.now(),
    });
  }

  function handleSimulatePartner2() {
    // Melanie's simulated priorities:
    // 1. Pay 18% card ($18,000)
    // 2. Add Life Insurance ($235,000) (Protection focus!)
    // 3. Umbrella cover ($1M)
    // 4. College 529 ($4,609)
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

    navigate(`/case/${activeCase.id}/sync`);
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white max-w-[420px] mx-auto p-5 flex flex-col justify-between select-none relative">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="pt-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Sliders className="w-3.5 h-3.5" />
            <span>Tactile Cash Allocator</span>
          </div>

          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
              partner === 'primary'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                : 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
            }`}
          >
            {currentPartnerName}’s Turn
          </span>
        </div>

        <h1 className="text-xl font-black text-white mt-2">
          Prioritize Your $150,000 Cash
        </h1>
        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
          Order the strategies by dragging or tapping arrows. What should your cash tackle first?
        </p>
      </div>

      {/* ── Strategies List ─────────────────────────────────────────────────── */}
      <div className="my-auto py-3 space-y-2.5">
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

      {/* ── Liquidity Tank Summary ─────────────────────────────────────────── */}
      <div className="space-y-3 pb-3">
        <AllocationSummary
          totalCash={totalCash}
          surplusCash={surplusCash}
          allocatedAmount={allocatedAmount}
        />

        {/* Lock-in action or Simulate Partner 2 modal */}
        {!hasLockedIn ? (
          <button
            onClick={handleLockIn}
            className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>Lock In {currentPartnerName}’s Priorities</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 space-y-3">
            <div className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>{currentPartnerName}’s priorities are locked!</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Now {otherPartnerName} needs to order their priorities on their mobile, or you can simulate their choices for the demo.
            </p>

            <button
              onClick={handleSimulatePartner2}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
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
