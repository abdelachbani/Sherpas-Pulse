/**
 * src/components/shared/SplitScreenToggle.tsx
 *
 * Projector / Live Demo Split Screen Toggle:
 * Allows presenter to seamlessly switch between:
 *  - Single Mobile View (standard max-w-[420px] mobile frame)
 *  - Split Screen Mode (two mobile frames side-by-side for stage projector):
 *      * Partner 1 on left, Partner 2 on right (Couple Consensus)
 *      * Client Action Plan on left, Advisor Telemetry on right (Sherpas Dashboard)
 */

import React from 'react';
import { Smartphone, Monitor, Users, Activity, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export type SplitMode = 'single' | 'split';
export type SplitTarget = 'partners' | 'advisor';

export interface SplitScreenToggleProps {
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  target?: SplitTarget;
  onTargetChange?: (target: SplitTarget) => void;
  showTargetSelector?: boolean;
  partner1Name?: string;
  partner2Name?: string;
  className?: string;
}

export function SplitScreenToggle({
  mode,
  onModeChange,
  target = 'advisor',
  onTargetChange,
  showTargetSelector = true,
  partner1Name = 'Partner 1',
  partner2Name = 'Partner 2',
  className = '',
}: SplitScreenToggleProps) {
  return (
    <div className={`w-full flex flex-col items-center gap-2 ${className}`}>
      {/* Primary Toggle Bar */}
      <div className="inline-flex p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
        <button
          type="button"
          onClick={() => onModeChange('single')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mode === 'single'
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Single Phone</span>
        </button>

        <button
          type="button"
          onClick={() => onModeChange('split')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all relative ${
            mode === 'split'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Split Screen</span>
          <span className="flex h-2 w-2 relative ml-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </button>
      </div>

      {/* Target Sub-Selector when Split Screen is active */}
      {mode === 'split' && showTargetSelector && onTargetChange && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px]"
        >
          <span className="text-slate-400 font-medium">Split View:</span>
          <button
            type="button"
            onClick={() => onTargetChange('advisor')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-medium transition-all ${
              target === 'advisor'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Client + Advisor Telemetry</span>
          </button>

          <button
            type="button"
            onClick={() => onTargetChange('partners')}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-medium transition-all ${
              target === 'partners'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>{partner1Name} + {partner2Name}</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

export interface SplitScreenContainerProps {
  mode: SplitMode;
  leftTitle?: string;
  leftSubtitle?: string;
  leftContent: React.ReactNode;
  rightTitle?: string;
  rightSubtitle?: string;
  rightContent: React.ReactNode;
  singleActiveTab?: 'left' | 'right';
  className?: string;
}

export function SplitScreenContainer({
  mode,
  leftTitle = 'Client Action View',
  leftSubtitle,
  leftContent,
  rightTitle = 'Advisor Telemetry',
  rightSubtitle,
  rightContent,
  singleActiveTab = 'left',
  className = '',
}: SplitScreenContainerProps) {
  if (mode === 'single') {
    return (
      <div className={`w-full max-w-[420px] mx-auto min-h-dvh flex flex-col ${className}`}>
        {singleActiveTab === 'left' ? leftContent : rightContent}
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto px-4 py-2 ${className}`}>
      {/* Projector Header Banner */}
      <div className="mb-4 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/70 border border-indigo-500/30 text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Stage Projector Mode · Dual View Synchronized in Real-Time</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Telemetry Sync</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start justify-center">
        {/* Left Mobile Device Frame */}
        <div className="w-full max-w-[420px] mx-auto rounded-[36px] bg-slate-900/90 border-2 border-slate-700/80 p-3 shadow-2xl shadow-indigo-950/40 relative overflow-hidden">
          {/* Top Speaker Notch */}
          <div className="flex justify-center mb-2">
            <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
              <div className="w-8 h-1.5 rounded-full bg-slate-800" />
            </div>
          </div>

          {/* Device Label */}
          <div className="px-3 py-1.5 mb-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              {leftTitle}
            </span>
            {leftSubtitle && <span className="text-[10px] text-slate-400">{leftSubtitle}</span>}
          </div>

          <div className="max-h-[820px] overflow-y-auto rounded-2xl bg-slate-950">
            {leftContent}
          </div>
        </div>

        {/* Right Mobile Device Frame */}
        <div className="w-full max-w-[420px] mx-auto rounded-[36px] bg-slate-900/90 border-2 border-slate-700/80 p-3 shadow-2xl shadow-purple-950/40 relative overflow-hidden">
          {/* Top Speaker Notch */}
          <div className="flex justify-center mb-2">
            <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-800 mr-2" />
              <div className="w-8 h-1.5 rounded-full bg-slate-800" />
            </div>
          </div>

          {/* Device Label */}
          <div className="px-3 py-1.5 mb-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              {rightTitle}
            </span>
            {rightSubtitle && <span className="text-[10px] text-slate-400">{rightSubtitle}</span>}
          </div>

          <div className="max-h-[820px] overflow-y-auto rounded-2xl bg-slate-950">
            {rightContent}
          </div>
        </div>
      </div>
    </div>
  );
}
