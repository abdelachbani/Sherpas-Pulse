/**
 * src/pages/FamilySyncPage.tsx
 *
 * Couple Consensus View ("Family Sync"):
 *  - Header with partner badges ("Timothy & Melanie · Family Sync")
 *  - Summary banner: "2 Instant Agreements · 1 Advisor Discussion Point"
 *  - Renders Green Zone cards and Amber Zone cards using extractHouseholdSync from src/lib/mcp/extractor.ts
 *  - "Continue to Your Action Plan" button -> navigates to /case/:caseId/action
 *  - "Review Cash Allocator" back button -> navigates to /case/:caseId/allocate
 *  - Mobile-first (max-w-[420px] mx-auto), dark slate theme matching existing pages.
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
  ShieldCheck,
  CalendarCheck,
  TrendingUp,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractHouseholdSync } from '../lib/mcp/extractor';
import { SyncCard } from '../components/couple/SyncCard';
import { GroundingInspector } from '../components/calibration/GroundingInspector';
import type { GroundingRef } from '../types';

export default function FamilySyncPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const coupleAllocations = useAppStore((s) => s.coupleAllocations);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);

  // Fallback to lookup from CASES if direct reload occurs
  const activeCase = currentCase ?? CASES.find((c) => c.id === caseId) ?? CASES[0];

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

  const agreementsCount = agreements.length;
  const tieBreakersCount = tieBreakers.length;

  const summaryBannerText = `${agreementsCount} Instant Agreement${
    agreementsCount === 1 ? '' : 's'
  } · ${tieBreakersCount} Advisor Discussion Point${tieBreakersCount === 1 ? '' : 's'}`;

  return (
    <div className="min-h-dvh bg-slate-950 text-white max-w-[420px] mx-auto p-4 sm:p-5 flex flex-col justify-between select-none relative">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="pt-2">
        {/* Category Pill & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <Users className="w-3.5 h-3.5" />
            <span>Family Alignment</span>
          </div>

          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Consensus Ready</span>
          </div>
        </div>

        {/* Header with partner badges ("Timothy & Melanie · Family Sync") */}
        <div className="mt-3 flex items-center flex-wrap gap-2 text-sm">
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold text-xs">
            {p1Name}
          </span>
          <span className="text-slate-400 font-semibold">&</span>
          <span className="px-2.5 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs">
            {p2Name}
          </span>
          <span className="text-slate-400 font-medium text-xs">· Family Sync</span>
        </div>

        <h1 className="text-xl font-black text-white mt-2 tracking-tight">
          Two Paces, One Aligned Plan
        </h1>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Here is where your priorities aligned instantly — and what we’ve teed up for your human advisor.
        </p>
      </div>

      {/* ── Summary Banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="my-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-amber-950/60 border border-emerald-500/30 shadow-lg"
      >
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </span>
          <div>
            <h2 className="text-xs font-black text-white tracking-wide uppercase">
              {summaryBannerText}
            </h2>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Instant action on debt & liability. 1 productive trade-off queued for your meeting.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Cards Scroll Area ───────────────────────────────────────────────── */}
      <div className="flex-1 space-y-4 my-1 overflow-y-auto pr-0.5 pb-3">
        {/* ── Green Zone Section ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Green Zone: Ready-to-Act</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {agreements.length} agreed
            </span>
          </div>

          <div className="space-y-3">
            {agreements.map((agreement, idx) => (
              <SyncCard
                key={agreement.strategyId}
                item={agreement}
                partner1Name={p1Name}
                partner2Name={p2Name}
                index={idx}
                onInspect={(ref) => setActiveGrounding(ref)}
              />
            ))}
          </div>
        </div>

        {/* ── Amber Zone Section ── */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Amber Zone: Advisor Tie-Breaker</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
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
      <div className="pt-3 pb-2 space-y-2 border-t border-slate-900 bg-slate-950/80 backdrop-blur-sm">
        {/* Continue to Action Plan Button */}
        <button
          onClick={() => navigate(`/case/${activeCase.id}/action`)}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
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
          <span>Review Cash Allocator</span>
        </button>
      </div>

      {/* ── Grounding Inspector Modal ───────────────────────────────────────── */}
      <GroundingInspector
        grounding={activeGrounding}
        onClose={() => setActiveGrounding(null)}
      />
    </div>
  );
}
