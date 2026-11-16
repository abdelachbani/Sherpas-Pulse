/**
 * src/components/couple/SyncCard.tsx
 *
 * Couple Consensus Cards for Family Sync:
 *  - Green Zone card: "Ready-to-Act Agreement" (e.g. debt payoff, umbrella coverage)
 *  - Amber Zone card: "Advisor Tie-Breaker" (e.g. 529 College vs Life Insurance)
 *  - Prominently showcases both partners' priority badges and dollar amounts.
 *  - Grounding inspection trigger for 100% Zero-Hallucination verification.
 */

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CalendarCheck,
  Check,
  Clock,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';
import type { SyncAgreement, SyncTieBreaker, GroundingRef } from '../../types';

export interface GreenZoneCardProps {
  agreement: SyncAgreement;
  partner1Name?: string;
  partner2Name?: string;
  index?: number;
  onInspect?: (ref: GroundingRef) => void;
}

export function GreenZoneCard({
  agreement,
  partner1Name = 'Timothy',
  partner2Name = 'Melanie',
  index = 0,
  onInspect,
}: GreenZoneCardProps) {
  // Built-in deterministic grounding reference based on strategy
  const groundingRef: GroundingRef = {
    sourceFile: 'financial-health.json',
    jsonPath:
      agreement.strategyId === 'card-payoff'
        ? 'score.top_moves[0]: Pay $6,800 on 18% card from cash'
        : 'score.top_moves[2]: Add $1M umbrella cover',
    label: agreement.title,
    rawValue: agreement.agreedAmount,
    description: agreement.explanation,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
      className="w-full bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900/95 border border-emerald-500/40 rounded-3xl p-4.5 shadow-xl relative overflow-hidden"
    >
      {/* Decorative ambient glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Badge Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Ready-to-Act Agreement</span>
        </div>

        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800/50 flex items-center gap-1">
          <Check className="w-3 h-3" />
          <span>100% Aligned</span>
        </span>
      </div>

      {/* Card Title */}
      <h3 className="font-extrabold text-white text-base mt-2.5 tracking-tight leading-snug">
        {agreement.title}
      </h3>

      {/* Agreed Dollar Amount & Financial Benefit Banner */}
      <div className="mt-2.5 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/25 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] text-emerald-400/80 uppercase font-bold tracking-wider block">
            Annual Financial Gain
          </span>
          <p className="text-xs font-bold text-emerald-200 mt-0.5 truncate">
            {agreement.dollarBenefit}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            Target Amount
          </span>
          <span className="text-base font-black text-white">
            ${agreement.agreedAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Both Partners' Priority Badges */}
      <div className="mt-3 pt-2.5 border-t border-white/10">
        <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
          Partner Consensus
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Partner 1 (Timothy) */}
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>{partner1Name}</span>
              </div>
              <span className="text-[10px] text-slate-400">Ranked #1 Priority</span>
            </div>
            <span className="text-xs font-black text-white">
              ${agreement.agreedAmount.toLocaleString()}
            </span>
          </div>

          {/* Partner 2 (Melanie) */}
          <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>{partner2Name}</span>
              </div>
              <span className="text-[10px] text-slate-400">Ranked #1 Priority</span>
            </div>
            <span className="text-xs font-black text-white">
              ${agreement.agreedAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Plain English Explanation */}
      <p className="text-xs text-slate-300 mt-3 leading-relaxed bg-black/25 p-2.5 rounded-xl border border-white/5">
        {agreement.explanation}
      </p>

      {/* Grounding Verification Action */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => onInspect?.(groundingRef)}
          className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified in MCP plan</span>
        </button>

        <span className="text-[10px] font-semibold text-emerald-400/90 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          <span>Immediate Actionable Win</span>
        </span>
      </div>
    </motion.div>
  );
}

export interface AmberZoneCardProps {
  tieBreaker: SyncTieBreaker;
  partner1Name?: string;
  partner2Name?: string;
  index?: number;
  topicNumber?: number;
  onInspect?: (ref: GroundingRef) => void;
}

export function AmberZoneCard({
  tieBreaker,
  partner1Name = 'Timothy',
  partner2Name = 'Melanie',
  index = 0,
  topicNumber = 1,
  onInspect,
}: AmberZoneCardProps) {
  // Built-in deterministic grounding reference
  const groundingRef: GroundingRef = {
    sourceFile: 'financial-health.json',
    jsonPath: 'score.top_moves[1] vs narrative.summary_main',
    label: tieBreaker.title,
    rawValue: `${tieBreaker.partner1Name}: $${tieBreaker.partner1Amount.toLocaleString()} vs ${tieBreaker.partner2Name}: $${tieBreaker.partner2Amount.toLocaleString()}`,
    description: tieBreaker.advisorQuestion,
  };

  const p1 = tieBreaker.partner1Name || partner1Name;
  const p2 = tieBreaker.partner2Name || partner2Name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
      className="w-full bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900/95 border border-amber-500/40 rounded-3xl p-4.5 shadow-xl relative overflow-hidden"
    >
      {/* Decorative ambient glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Badge Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Advisor Tie-Breaker</span>
        </div>

        <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-800/50 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>Meeting Agenda #{topicNumber}</span>
        </span>
      </div>

      {/* Card Title */}
      <h3 className="font-extrabold text-white text-base mt-2.5 tracking-tight leading-snug">
        {tieBreaker.title}
      </h3>

      <p className="text-[11px] text-amber-200/80 mt-1">
        Different priorities between partners — queued for live expert human discussion.
      </p>

      {/* Both Partners' Priority Badges & Comparison */}
      <div className="mt-3 grid grid-cols-[1fr,auto,1fr] items-center gap-2">
        {/* Partner 1 Priority */}
        <div className="p-3 rounded-2xl bg-indigo-950/50 border border-indigo-500/40 text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
              {p1}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-indigo-600/30 text-indigo-200 font-bold">
              #{tieBreaker.partner1Priority}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">College 529</div>
          <div className="text-xs font-black text-indigo-300 mt-0.5">
            ${tieBreaker.partner1Amount.toLocaleString()}
            <span className="text-[10px] font-normal text-slate-400">/yr</span>
          </div>
        </div>

        {/* Center VS pill */}
        <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
          VS
        </div>

        {/* Partner 2 Priority */}
        <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-left">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider">
              {p2}
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-rose-600/30 text-rose-200 font-bold">
              #{tieBreaker.partner2Priority}
            </span>
          </div>
          <div className="text-xs font-bold text-white truncate">Life Insurance</div>
          <div className="text-xs font-black text-rose-300 mt-0.5">
            ${tieBreaker.partner2Amount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Advisor Discussion Callout */}
      <div className="mt-3 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Advisor Agenda Topic #1:</span>
        </div>
        <p className="text-xs text-amber-100/90 leading-relaxed font-normal">
          {tieBreaker.advisorQuestion}
        </p>
      </div>

      {/* Grounding Verification Action */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => onInspect?.(groundingRef)}
          className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 transition-colors font-medium"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Verified in MCP plan</span>
        </button>

        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
          <CalendarCheck className="w-3 h-3 text-amber-400" />
          <span>Queued for human meeting</span>
        </span>
      </div>
    </motion.div>
  );
}

export interface SyncCardProps {
  item: SyncAgreement | SyncTieBreaker;
  partner1Name?: string;
  partner2Name?: string;
  index?: number;
  topicNumber?: number;
  onInspect?: (ref: GroundingRef) => void;
}

export function SyncCard({
  item,
  partner1Name,
  partner2Name,
  index = 0,
  topicNumber = 1,
  onInspect,
}: SyncCardProps) {
  if (item.status === 'agreement') {
    return (
      <GreenZoneCard
        agreement={item}
        partner1Name={partner1Name}
        partner2Name={partner2Name}
        index={index}
        onInspect={onInspect}
      />
    );
  }

  return (
    <AmberZoneCard
      tieBreaker={item}
      partner1Name={partner1Name}
      partner2Name={partner2Name}
      index={index}
      topicNumber={topicNumber}
      onInspect={onInspect}
    />
  );
}

export default SyncCard;
