/**
 * src/components/stories/StoryDataViz.tsx
 *
 * Compact & responsive data visualizations for the 6 Financial Wrapped story cards.
 * Designed specifically for mobile vertical viewports (390x844 & smaller) to prevent
 * any vertical squishing, scrolling collisions, or element overlap.
 */

import { motion } from 'framer-motion';
import {
  TrendingUp,
  AlertTriangle,
  GraduationCap,
  Home,
  Car,
  Palmtree,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Droplets,
} from 'lucide-react';
import type { PillarScore, ChartGoal } from '../../types';

// ─── 1. Health Score Animated Ring (Compact for Mobile) ─────────────────────

export function ScoreRing({
  score,
  band,
  colour = 'yellow',
  size = 120, // Compact 120px default for mobile
}: {
  score: number;
  band: string;
  colour?: string;
  size?: number;
}) {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const ringColor =
    colour === 'green' || score >= 80
      ? '#10b981'
      : colour === 'yellow' || score >= 60
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="relative flex flex-col items-center justify-center my-2">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-3xl font-black text-white tracking-tight"
        >
          {score}
        </motion.span>
        <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold">
          {band}
        </span>
      </div>
    </div>
  );
}

// ─── 2. Pillar Scores Progress Bars (Compact) ───────────────────────────────

export function PillarBars({ pillars }: { pillars: PillarScore[] }) {
  return (
    <div className="w-full space-y-1.5 my-2">
      {pillars.map((p, idx) => {
        const isStrong = p.score >= 80;
        const isModerate = p.score >= 60 && p.score < 80;
        const barColor = isStrong ? 'bg-emerald-400' : isModerate ? 'bg-amber-400' : 'bg-rose-400';

        return (
          <div key={p.pillar} className="space-y-0.5">
            <div className="flex justify-between text-[11px] font-medium">
              <span className="text-slate-300 truncate pr-2">{p.pillar}</span>
              <span className="text-white font-bold">{p.score}/100</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${p.score}%` }}
                transition={{ duration: 0.8, delay: idx * 0.1, ease: 'easeOut' }}
                className={`h-full rounded-full ${barColor}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── 3. Superpower vs. Silent Leak (Side-by-Side 2-Column on Mobile) ─────────

export function SuperpowerVsLeakViz({
  superpowerLabel,
  superpowerVal,
  superpowerSub,
  leakLabel,
  leakVal,
  leakSub,
  onInspectLeak,
}: {
  superpowerLabel: string;
  superpowerVal: string;
  superpowerSub: string;
  leakLabel: string;
  leakVal: string;
  leakSub: string;
  onInspectLeak?: () => void;
}) {
  return (
    <div className="w-full grid grid-cols-2 gap-2.5 my-2">
      {/* Superpower Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 relative overflow-hidden flex flex-col justify-between"
      >
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Superpower
          </span>
          <div className="text-xl font-black text-white mt-1 leading-tight">{superpowerVal}</div>
          <div className="text-[11px] text-slate-200 mt-0.5 font-medium leading-tight">{superpowerLabel}</div>
        </div>
        <div className="text-[9px] text-slate-400 mt-1.5 leading-tight">{superpowerSub}</div>
      </motion.div>

      {/* Silent Leak Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-3 rounded-2xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-500/40 relative overflow-hidden flex flex-col justify-between cursor-pointer"
        onClick={onInspectLeak}
      >
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Silent Leak
            </span>
            <ShieldCheck className="w-3 h-3 text-rose-400" />
          </div>
          <div className="text-xl font-black text-rose-200 mt-1 leading-tight">{leakVal}</div>
          <div className="text-[11px] text-slate-200 mt-0.5 font-medium leading-tight">{leakLabel}</div>
        </div>
        <div className="text-[9px] text-rose-300/80 mt-1.5 leading-tight">{leakSub}</div>
      </motion.div>
    </div>
  );
}

// ─── 4. Real-Life Translator Graphic (Compact) ───────────────────────────────

export function RealLifeTranslatorViz({
  annualCost,
  equivalentMilestone,
  explanation,
}: {
  annualCost: string;
  equivalentMilestone: string;
  explanation: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 my-2 space-y-2.5"
    >
      <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
          Life-Unit Translation
        </span>
        <span className="text-[10px] text-slate-400">Equal Value</span>
      </div>

      <div className="flex items-center justify-between gap-2 text-center">
        <div className="flex-1 p-2 rounded-xl bg-rose-950/30 border border-rose-500/20">
          <div className="text-[10px] text-slate-400">Interest Burned</div>
          <div className="text-lg font-black text-rose-300 mt-0.5">{annualCost}</div>
          <div className="text-[9px] text-rose-400/80">Every year</div>
        </div>

        <div className="text-sm font-black text-slate-400">≈</div>

        <div className="flex-1 p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
          <div className="text-[10px] text-slate-400">Child's Future</div>
          <div className="text-xs font-bold text-indigo-300 mt-0.5 leading-tight">
            {equivalentMilestone}
          </div>
          <div className="text-[9px] text-indigo-400/80">Fully Funded</div>
        </div>
      </div>

      <p className="text-[11px] text-slate-300 leading-snug bg-slate-800/60 p-2.5 rounded-xl">
        {explanation}
      </p>
    </motion.div>
  );
}

// ─── 5. Liquidity Tank Preview (Compact) ─────────────────────────────────────

export function LiquidityTankPreview({
  totalCash = '$150,000',
  surplusCash = '$60,222',
  strategiesCount = 4,
}: {
  totalCash?: string;
  surplusCash?: string;
  strategiesCount?: number;
}) {
  return (
    <div className="w-full p-3.5 rounded-2xl bg-slate-900/80 border border-sky-500/30 my-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sky-400 font-semibold text-xs">
          <Droplets className="w-3.5 h-3.5" />
          <span>Available Cash Reservoir</span>
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
          {totalCash} Total
        </span>
      </div>

      <div className="h-5 w-full bg-slate-950 rounded-xl overflow-hidden p-0.5 border border-slate-800 flex gap-1">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          transition={{ duration: 1.0, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-lg flex items-center justify-center text-[9px] font-bold text-white shadow-inner"
        >
          {surplusCash} Surplus
        </motion.div>
        <div className="h-full bg-slate-800 rounded-lg flex-1 flex items-center justify-center text-[8px] text-slate-400 font-medium">
          Safety Reserve
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
        <span>{strategiesCount} strategies competing for this cash</span>
        <span className="text-indigo-400 font-semibold">Prioritize next →</span>
      </div>
    </div>
  );
}

// ─── 6. Living Map Milestone Timeline (Compact) ──────────────────────────────

export function TimelineMini({
  retirementAge = 62,
}: {
  retirementAge?: number;
}) {
  const milestones = [
    { label: 'Today', year: 2026, icon: Sparkles, color: 'text-sky-400 bg-sky-950/60' },
    { label: 'Vehicle', year: 2028, icon: Car, color: 'text-amber-400 bg-amber-950/60' },
    { label: 'Home Upgrade', year: 2030, icon: Home, color: 'text-indigo-400 bg-indigo-950/60' },
    { label: 'College', year: 2038, icon: GraduationCap, color: 'text-purple-400 bg-purple-950/60' },
    { label: `Retire (${retirementAge})`, year: 2048, icon: Palmtree, color: 'text-emerald-400 bg-emerald-950/60' },
  ];

  return (
    <div className="w-full my-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>Milestone Horizon</span>
        <span className="text-[10px] text-slate-400">2026 → 2048+</span>
      </div>

      <div className="flex items-center justify-between relative pt-1">
        <div className="absolute top-4 left-3 right-3 h-0.5 bg-slate-700/80 -z-0" />

        {milestones.map((m, idx) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="flex flex-col items-center z-10 text-center"
            >
              <div className={`w-7 h-7 rounded-full border border-slate-700 flex items-center justify-center ${m.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[9px] font-bold text-white mt-1">{m.year}</span>
              <span className="text-[8px] text-slate-400 max-w-[46px] truncate">{m.label}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 7. 5-Minute Win Action Checklist (Compact) ──────────────────────────────

export function DominoChecklist({
  steps,
  completed,
  onToggleStep,
}: {
  steps: string[];
  completed: boolean[];
  onToggleStep: (idx: number) => void;
}) {
  return (
    <div className="w-full space-y-2 my-2">
      {steps.map((step, idx) => {
        const isDone = completed[idx] ?? false;
        return (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onToggleStep(idx)}
            className={`p-3 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-all active:scale-[0.98] ${
              isDone
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                : 'bg-slate-900/80 border-slate-700/70 text-slate-200'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px] transition-colors ${
                isDone
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 border border-slate-600 text-slate-400'
              }`}
            >
              {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
            </div>
            <div className="flex-1 text-[11px] leading-snug font-medium">
              <span className={isDone ? 'line-through opacity-70' : ''}>{step}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
