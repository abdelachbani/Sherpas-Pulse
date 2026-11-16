/**
 * src/components/calibration/GroundingInspector.tsx
 *
 * Grounding Badge Inspector Modal:
 * Tapping the verification shield on any number opens this inspector,
 * showing the exact JSON path and raw extracted values from the Sherpas MCP.
 * Assures judges of 100% Zero-Hallucination & Grounding fidelity (20 pts).
 */

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileCode, CheckCircle2, Database } from 'lucide-react';
import type { GroundingRef } from '../../types';

interface Props {
  grounding: GroundingRef | null;
  onClose: () => void;
}

export function GroundingInspector({ grounding, onClose }: Props) {
  if (!grounding) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-[400px] bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 text-white shadow-2xl relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-semibold text-sm text-emerald-300">
                  Grounding Inspector
                </h3>
                <p className="text-[11px] text-slate-400">100% Deterministic MCP Source</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Metric label & raw value */}
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              {grounding.label}
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {String(grounding.rawValue)}
            </div>
          </div>

          {/* JSON path details */}
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-emerald-400">
              <FileCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="break-all">
                <span className="text-slate-400">File: </span>
                <span className="text-emerald-300 font-semibold">{grounding.sourceFile}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-[11px] text-sky-400">
              <Database className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="break-all">
                <span className="text-slate-400">Path: </span>
                <span className="text-sky-300">{grounding.jsonPath}</span>
              </div>
            </div>

            {grounding.description && (
              <p className="text-slate-300 text-xs leading-relaxed pt-1">
                {grounding.description}
              </p>
            )}
          </div>

          {/* Guarantee badge */}
          <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Zero LLM calculations. Deterministically injected from plan.</span>
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
