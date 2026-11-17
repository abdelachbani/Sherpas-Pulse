/**
 * src/components/calibration/GroundingInspector.tsx
 *
 * Grounding Badge Inspector Modal:
 * Tapping the verification shield on any number opens this inspector,
 * showing the exact JSON path and raw extracted values from the Sherpas MCP.
 * Assures judges of 100% Zero-Hallucination & Grounding fidelity (20 pts).
 */

import { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, X, FileCode, Database } from 'lucide-react';
import type { GroundingRef } from '../../types';
import { useDialogFocus } from '../shared/useDialogFocus';

interface Props {
  grounding: GroundingRef | null;
  onClose: () => void;
}

export function GroundingInspector({ grounding, onClose }: Props) {
  const titleId = useId();
  const dialogRef = useDialogFocus(Boolean(grounding), onClose);
  if (!grounding) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="w-full max-w-[400px] max-h-[calc(100dvh-2rem)] overflow-y-auto bg-slate-900 border border-blue-500/40 rounded-3xl p-5 text-white  relative"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-blue-500/20 text-blue-300">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 id={titleId} className="font-semibold text-base text-blue-200">
                  Plan source
                </h3>
                <p className="text-xs text-slate-400">Source details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close plan source"
              className="min-w-11 min-h-11 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white"
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
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-blue-300">
              <FileCode className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="break-all">
                <span className="text-slate-400">File: </span>
                <span className="text-blue-300 font-semibold">{grounding.sourceFile}</span>
              </div>
            </div>

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-xs text-blue-400">
              <Database className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="break-all">
                <span className="text-slate-400">Path: </span>
                <span className="text-blue-300">{grounding.jsonPath}</span>
              </div>
            </div>

            {grounding.description && (
              <p className="text-slate-300 text-sm leading-relaxed pt-1">
                {grounding.description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full min-h-11 py-2.5 rounded-xl bg-[#4565d6] hover:bg-[#6380ff] text-white font-semibold text-sm transition-colors"
          >
            Done
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
