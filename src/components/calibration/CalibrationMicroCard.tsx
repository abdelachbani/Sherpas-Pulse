/**
 * src/components/calibration/CalibrationMicroCard.tsx
 *
 * Implicit Calibration Micro-Card:
 * Resolves the "confused face" problem when no advisor is in the room.
 * Slides up over the paused story, explaining the concept with an everyday analogy
 * and the client's exact numbers from the MCP JSON.
 */

import { useId } from 'react';
import { motion, useIsPresent } from 'framer-motion';
import { Lightbulb, Check, ShieldCheck, Sparkles } from 'lucide-react';
import type { CalibrationCard, GroundingRef } from '../../types';
import { useDialogFocus } from '../shared/useDialogFocus';
import { FinancialText } from '../shared/FinancialText';

interface Props {
  card: CalibrationCard;
  onDismiss: () => void;
  onInspectGrounding: (ref: GroundingRef) => void;
}

export function CalibrationMicroCard({ card, onDismiss, onInspectGrounding }: Props) {
  const titleId = useId();
  const isPresent = useIsPresent();
  const dialogRef = useDialogFocus(isPresent, onDismiss);
  return (
    <motion.div
      ref={dialogRef}
      role={isPresent ? "dialog" : undefined}
      aria-modal={isPresent ? "true" : undefined}
      aria-labelledby={titleId}
      aria-hidden={!isPresent}
      inert={!isPresent}
      tabIndex={-1}
      initial={{ opacity: 0, y: 120 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 120 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-40 bg-slate-900/95 border-t border-slate-700/80 rounded-t-3xl p-5 text-white   max-h-[85dvh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Handle */}
      <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-4" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-1 border border-blue-500/30">
            <Sparkles className="w-3 h-3" />
            <span>Financial term</span>
          </div>
          <h2 id={titleId} className="text-xl font-bold text-white tracking-tight"><FinancialText text={card.term} /></h2>
          <p className="text-sm text-slate-400 font-medium"><FinancialText text={card.headline} /></p>
        </div>
      </div>

      {/* Analogy box */}
      <div className="mt-4 p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-blue-100 text-sm leading-relaxed flex gap-3">
        <Lightbulb className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-blue-300 block mb-1">Everyday Analogy:</span>
          <FinancialText text={card.analogy} />
        </div>
      </div>

      {/* Sherpas take */}
      <div className="mt-3 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-300 text-sm leading-relaxed">
        <span className="font-semibold text-slate-200 block mb-1">What this means in your plan:</span>
        <FinancialText text={card.sherpasTake} />
      </div>

      {/* Plan numbers */}
      {card.numbers.length > 0 && (
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Your Exact Numbers
          </div>
          <div className="grid grid-cols-2 gap-2">
            {card.numbers.map((num, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/80 border border-slate-700"
              >
                <div className="text-xs text-slate-400"><FinancialText text={num.label} /></div>
                <div className="text-base font-bold text-white mt-0.5">
                  <FinancialText text={String(num.value)} />
                  {num.unit && <span className="text-xs font-normal text-slate-400 ml-1"><FinancialText text={num.unit} /></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grounding inspector trigger */}
      {card.groundingRefs.length > 0 && (
        <button
          onClick={() => onInspectGrounding(card.groundingRefs[0])}
          className="mt-3 flex items-center justify-center gap-1.5 w-full min-h-11 py-1.5 text-sm text-blue-300 hover:text-blue-200 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>View plan source</span>
        </button>
      )}

      {/* Got it button */}
      <button
        onClick={onDismiss}
        className="mt-4 w-full py-3 rounded-2xl bg-[#4565d6] hover:bg-[#6380ff] text-white font-semibold text-sm flex items-center justify-center gap-2   transition-all active:scale-[0.98]"
      >
        <Check className="w-4 h-4" />
        <span>Got it — Resume Plan</span>
      </button>
    </motion.div>
  );
}
