/**
 * src/pages/FamilySyncPage.tsx
 *
 * Couple Consensus View ("Family Sync"):
 *  - Header with partner badges ("Timothy & Melanie · Family Sync")
 *  - Summary banner: "2 Instant Agreements · 1 Advisor Discussion Point"
 *  - Renders Green Zone cards and Amber Zone cards using extractHouseholdSync from src/lib/mcp/extractor.ts
 *  - "Continue to Your Action Plan" button -> navigates to /case/:caseId/action
 *  - "Review Cash Allocator" back button -> navigates to /case/:caseId/allocate
 *  - Mobile-first (max-w-3xl mx-auto), dark slate theme matching existing pages.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractHouseholdSync } from '../lib/mcp/extractor';
import { SyncCard } from '../components/couple/SyncCard';
import { GroundingInspector } from '../components/calibration/GroundingInspector';
import type { GroundingRef } from '../types';

export default function FamilySyncPage() {
  const { caseId } = useParams<{ caseId: string }>();
  if (!CASES.some((item) => item.id === caseId)) {
    return <main className="session-page min-h-dvh bg-[#171827] text-white p-8"><div className="max-w-3xl mx-auto"><h1 className="text-2xl font-semibold">Household not found</h1><p className="mt-3 text-sm text-slate-300">This household link is unavailable. Choose a household to continue.</p><a className="inline-flex min-h-11 items-center mt-6 text-indigo-300 underline" href="/">Choose a household</a></div></main>;
  }
  return <FamilySyncPageContent key={caseId} />;
}

function FamilySyncPageContent() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const coupleAllocations = useAppStore((s) => s.coupleAllocations);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);

  // Fallback to lookup from CASES if direct reload occurs
  const activeCase = (currentCase?.id === caseId ? currentCase : CASES.find((c) => c.id === caseId))!;

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  useEffect(() => {
    addTelemetryEvent({
      type: 'story_complete',
      payload: { page: 'family_sync', caseId: activeCase.id },
      timestamp: Date.now(),
      storyId: 'sync-consensus',
    });
  }, [activeCase.id, addTelemetryEvent]);

  // Extract household members' first names
  const client = activeCase.financialHealth?.case?.household?.find((m) => m.role === 'client');
  const coClient = activeCase.financialHealth?.case?.household?.find((m) => m.role === 'co-client');

  const p1Name = coupleAllocations.primary?.partner || client?.first_name || 'Timothy';
  const p2Name = coupleAllocations.secondary?.partner || coClient?.first_name || 'Melanie';

  // Deterministic sync extraction using MCP layer
  const { agreements, tieBreakers } = extractHouseholdSync(
    activeCase.id,
    coupleAllocations.primary,
    coupleAllocations.secondary
  );

  const bothReviewed = Boolean(coupleAllocations.primary && coupleAllocations.secondary);
  const agreementsCount = agreements.length;
  const tieBreakersCount = tieBreakers.length;

  const summaryBannerText = `${agreementsCount} Instant Agreement${
    agreementsCount === 1 ? '' : 's'
  } · ${tieBreakersCount} Advisor Discussion Point${tieBreakersCount === 1 ? '' : 's'}`;

  return (
    <main className="session-page min-h-dvh bg-[#171827] text-white max-w-3xl mx-auto p-5 sm:p-6 flex flex-col justify-between relative">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="pt-2">
        {/* Category Pill & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>Family Alignment</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 " />
            <span>{bothReviewed ? 'Reviews compared' : 'Waiting for both reviews'}</span>
          </div>
        </div>

        {/* Header with partner badges ("Timothy & Melanie · Family Sync") */}
        <div className="mt-3 flex items-center flex-wrap gap-2 text-sm">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs">
            {p1Name}
          </span>
          <span className="text-slate-400 font-semibold">&</span>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs">
            {p2Name}
          </span>
          <span className="text-slate-400 font-medium text-xs">· Family Sync</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white mt-2 tracking-tight">
          Two Paces, One Aligned Plan
        </h1>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Compare your choices and identify the priorities you may want to discuss together.
        </p>
      </div>

      {/* ── Summary Banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="my-5 p-4 rounded-2xl bg-[#202237] border border-emerald-500/30"
      >
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              {bothReviewed ? summaryBannerText : 'Both reviews are needed to compare priorities'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 leading-snug">
              {bothReviewed ? 'These results reflect the priorities saved in this session.' : 'Each partner can save their order in the priorities screen.'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Cards Scroll Area ───────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 my-4 pb-3">
        {/* ── Green Zone Section ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Shared priorities</span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {agreements.length} agreed
            </span>
          </div>

          <div className="space-y-3">
            {agreements.map((agreement, idx) => (
              <SyncCard
                key={agreement.strategyId}
                item={agreement}
                priority={coupleAllocations.primary?.allocations.find((a) => a.strategyId === agreement.strategyId)?.priority}
                partner1Name={p1Name}
                partner2Name={p2Name}
                index={idx}
                onInspect={(ref) => setActiveGrounding(ref)}
              />
            ))}
          </div>
        </div>

        {bothReviewed && agreements.length === 0 && <p className="text-sm text-slate-300">No matching priorities were found in these reviews.</p>}

        {/* ── Amber Zone Section ── */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Priorities to discuss</span>
            </div>
            <span className="text-xs font-semibold text-slate-400">
              {tieBreakers.length} discussion topic
            </span>
          </div>

          <div className="space-y-3">
            {tieBreakers.map((tb, idx) => (
              <SyncCard
                key={tb.strategyId}
                item={tb}
                partner1Name={p1Name}
                partner2Name={p2Name}
                index={idx + agreements.length}
                topicNumber={idx + 1}
                onInspect={(ref) => setActiveGrounding(ref)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Action Footer ────────────────────────────────────────────── */}
      <div className="pt-3 pb-2 space-y-2 border-t border-slate-700/70 bg-[#171827]">
        {/* Continue to Action Plan Button */}
        <button
          onClick={() => navigate(`/case/${activeCase.id}/action`)}
          className="w-full py-3.5 rounded-2xl bg-[#4565d6] hover:bg-[#6380ff] text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <span>Continue to Your Action Plan</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Review Cash Allocator Back Button */}
        <button
          onClick={() => navigate(`/case/${activeCase.id}/allocate`)}
          className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Review priorities</span>
        </button>
      </div>

      {/* ── Grounding Inspector Modal ───────────────────────────────────────── */}
      <GroundingInspector
        grounding={activeGrounding}
        onClose={() => setActiveGrounding(null)}
      />
    </main>
  );
}
