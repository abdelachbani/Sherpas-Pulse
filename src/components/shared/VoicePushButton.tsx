/**
 * src/components/shared/VoicePushButton.tsx
 *
 * Push-to-Ask voice component for Sherpas Pulse:
 *  - Simple, elegant Hold-to-Ask bottom button
 *  - Touch & mouse hold-to-ask interactions with touch-action: none
 *  - Live transcript bubble + Sherpas audio response
 *  - Automatic 1-tap suggestions fallback if mic was quiet or quick-tapped
 *  - 1-tap shortcut to open Calibration Micro-Card on detected terms
 */

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Bot,
  AlertCircle,
  X,
  Sparkles,
  Volume2,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { VoiceState } from '../../lib/voice/useVoiceSession';
import { FinancialText } from './FinancialText';

interface Props {
  caseId?: string;
  voiceState: VoiceState;
  transcript: string;
  responseMessage?: string | null;
  guardRedirect?: string | null;
  detectedTerm?: string | null;
  showSuggestions?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  onStopSpeaking?: () => void;
  onSelectSuggestion?: (question: string) => void;
  onOpenCalibration?: (termKey: string) => void;
  onClosePopup?: () => void;
  disabled?: boolean;
  compact?: boolean;
  onOverlayChange?: (open: boolean) => void;
}

const HOUSEHOLD_QUESTIONS: Record<
  string,
  { icon: string; label: string; query: string }[]
> = {
  'timothy-melanie-weah': [
    { icon: '💳', label: '18% Credit Card', query: 'Why pay off the 18% Chase card first?' },
    { icon: '🛡️', label: 'Umbrella Liability', query: 'What is umbrella liability insurance?' },
    { icon: '🎓', label: '529 College Plan', query: 'How does the 529 college plan work?' },
    { icon: '🪙', label: 'What about Bitcoin?', query: 'Should I invest in Bitcoin or crypto?' },
  ],
  'daniel-emily-johnson': [
    { icon: '🛡️', label: 'Life Insurance', query: 'Why increase our life insurance coverage?' },
    { icon: '🎓', label: 'Oliver & Sophia 529', query: 'How much to fund college and retire at 62?' },
    { icon: '💳', label: 'Cash Optimization', query: 'How should we allocate our cash surplus?' },
    { icon: '🪙', label: 'Single Stock Picks', query: 'Should we buy Nvidia or tech stocks?' },
  ],
  'michael-carter': [
    { icon: '🏡', label: '$550k Home in 2027', query: 'Can I afford to buy a $550,000 home in 2027?' },
    { icon: '⏳', label: 'Retire at 58 vs 60', query: 'What is the impact of retiring at 58 vs 60?' },
    { icon: '🛡️', label: 'Umbrella Liability', query: 'What is umbrella liability insurance?' },
    { icon: '🪙', label: 'Crypto Allocation', query: 'Can I put 10% into Bitcoin or crypto?' },
  ],
  'samantha-lewis': [
    { icon: '🎓', label: 'College Tuition Now', query: 'How do I fund college tuition starting this year?' },
    { icon: '🏖️', label: 'Second Home in 2030', query: 'Can I buy a second home in 2030?' },
    { icon: '🛡️', label: 'Income Protection', query: 'Is my life and disability insurance sufficient?' },
    { icon: '🪙', label: 'Growth Stock Picks', query: 'What about high-growth stock picks?' },
  ],
};

const DEFAULT_QUESTIONS = [
  { icon: '💳', label: '18% Credit Card', query: 'Why pay off the 18% credit card first?' },
  { icon: '🛡️', label: 'Umbrella Liability', query: 'What is umbrella liability insurance?' },
  { icon: '🎓', label: '529 College Plan', query: 'How does the 529 college plan work?' },
  { icon: '🪙', label: 'What about Bitcoin?', query: 'Should I invest in Bitcoin or crypto?' },
];

export function VoicePushButton({
  caseId = 'timothy-melanie-weah',
  voiceState,
  transcript,
  responseMessage,
  guardRedirect,
  detectedTerm,
  showSuggestions = false,
  onPressStart,
  onPressEnd,
  onStopSpeaking,
  onSelectSuggestion,
  onOpenCalibration,
  onClosePopup,
  disabled,
  compact = false,
  onOverlayChange,
}: Props) {
  const [customText, setCustomText] = useState('');
  const [opened, setOpened] = useState(false);
  const isPressingRef = useRef(false);
  const sampleQuestions = HOUSEHOLD_QUESTIONS[caseId] || DEFAULT_QUESTIONS;

  function handleSubmitCustom(e: React.FormEvent) {
    e.preventDefault();
    const clean = customText.trim();
    if (!clean) return;
    onSelectSuggestion?.(clean);
    setCustomText('');
  }

  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return;
    e.stopPropagation();
    setOpened(true);

    // If currently speaking, a tap stops/mutes speech
    if (voiceState === 'speaking') {
      onStopSpeaking?.();
      return;
    }

    if (isPressingRef.current) return;
    isPressingRef.current = true;
    onPressStart();
  }

  function handleEnd(e: React.TouchEvent | React.MouseEvent) {
    e.stopPropagation();
    if (!isPressingRef.current) return;
    isPressingRef.current = false;
    onPressEnd();
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.cancelable) e.preventDefault();
    handleStart(e);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (e.cancelable) e.preventDefault();
    handleEnd(e);
  }

  function handleTouchCancel(e: React.TouchEvent) {
    handleEnd(e);
  }

  function handleMouseDown(e: React.MouseEvent) {
    handleStart(e);
  }

  function handleMouseUp(e: React.MouseEvent) {
    handleEnd(e);
  }

  function handleMouseLeave(e: React.MouseEvent) {
    handleEnd(e);
  }

  useEffect(() => {
    const handleWindowBlur = () => {
      if (isPressingRef.current) {
        isPressingRef.current = false;
        onPressEnd();
      }
    };
    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, [onPressEnd]);

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const hasContent = opened && Boolean(isListening || responseMessage || guardRedirect || showSuggestions);
  useEffect(() => { onOverlayChange?.(hasContent); }, [hasContent, onOverlayChange]);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* ── Speech / Suggestion Modal Bubble ──────────────────────────────── */}
      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute ${compact ? 'top-full right-0 mt-3' : 'bottom-full mb-3'} w-[340px] max-w-[calc(100vw-2rem)] max-h-[70dvh] overflow-y-auto p-3.5 rounded-2xl text-xs border bg-slate-900 border-slate-700 text-white z-50 space-y-2.5`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
                {guardRedirect ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Guardrail Redirect</span>
                  </>
                ) : isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 " />
                    <span className="text-rose-300">Listening to your voice...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-blue-400 " />
                    <span className="text-blue-300">Sherpas Voice Answer</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-blue-300">Ask Your Sherpas Guide</span>
                  </>
                )}
              </div>

              {onClosePopup && (
                <button
                  onClick={() => { setOpened(false); onClosePopup(); }}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Listening Live Transcript */}
            {isListening && (
              <p className="text-xs text-rose-200 font-medium leading-relaxed italic">
                {transcript ? <FinancialText text={transcript} /> : 'Listening... Say your question now'}
              </p>
            )}

            {/* AI Response Message or Guardrail Notice */}
            {!isListening && (responseMessage || guardRedirect) && (
              <div className="space-y-2">
                {transcript && (
                  <div className="text-xs text-slate-400">
                    You asked: <span className="text-slate-200 italic">"<FinancialText text={transcript} />"</span>
                  </div>
                )}
                <div className="text-xs text-slate-100 leading-relaxed font-normal bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold mb-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Plan Verified Numbers</span>
                  </div>
                  <FinancialText text={guardRedirect || responseMessage || ''} />
                </div>

                {/* 1-Tap shortcut to Calibration Micro-Card */}
                {detectedTerm && onOpenCalibration && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCalibration(detectedTerm);
                      onClosePopup?.();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Everyday Analogy & MCP Data</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
              </div>
            )}

            {/* Suggestion Chips when mic was quiet or quick-tapped */}
            {!isListening && (!responseMessage || showSuggestions) && (
              <div className="space-y-1.5 pt-0.5">
                <span className="text-xs text-slate-400 font-semibold block">
                  Tap any question to ask instantly:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {sampleQuestions.map((q) => (
                    <div key={q.label} className="rounded-xl bg-slate-800/80 border border-slate-700 p-2">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{q.icon}</span>
                        <span className="min-w-0"><FinancialText text={q.label} /></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectSuggestion?.(q.query)}
                        className="mt-1 min-h-11 w-full text-left text-xs font-medium text-blue-300 hover:text-blue-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400"
                      >
                        Ask this question
                      </button>
                    </div>
                  ))}
                </div>

                {/* Direct text input for any browser (Edge/Safari/Chrome) */}
                <form onSubmit={handleSubmitCustom} className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={customText}
                    aria-label="Ask a question about your plan"
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Or type a question (e.g. ¿cuánto dinero tengo?)..."
                    className="min-w-0 flex-1 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                  <button
                    type="submit"
                    disabled={!customText.trim()}
                    className="min-h-11 px-3 py-1.5 rounded-xl bg-[#4565d6] hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Ask
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Push-to-Ask Dock Button ─────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">


        <motion.button

          transition={{ duration: 0.12 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchCancel}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled}
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          className={`flex items-center gap-2 min-h-11 ${compact ? 'px-3' : 'px-4'} py-2 rounded-full text-xs font-bold  border transition-all cursor-pointer select-none ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400  ring-4 ring-rose-500/20'
              : isSpeaking
              ? 'bg-blue-600 text-white border-blue-400  '
              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:border-slate-500 hover:text-white '
          }`}
          aria-label={isListening ? 'Release to ask' : 'Hold to ask'}
        >
          {isListening ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white text-white" />
              <span className={compact ? 'sr-only' : undefined}>Release to Send</span>
            </>
          ) : isSpeaking ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-300 " />
              <span className={compact ? 'sr-only' : undefined}>Sherpas Answering...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-blue-400" />
              <span className={compact ? 'sr-only' : undefined}>Hold to Ask</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
