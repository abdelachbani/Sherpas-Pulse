/**
 * src/components/shared/VoicePushButton.tsx
 *
 * Push-to-Ask voice component for Sherpas Pulse:
 *  - Modern PointerEvents (onPointerDown, onPointerUp, onPointerCancel) with setPointerCapture
 *  - Cross-browser support for Chrome, Edge, Safari, touchscreens, mouse, and trackpads
 *  - Clean separation:
 *      a) Quick single tap (<250ms) toggles the suggestions and question input modal
 *      b) Holding (>=250ms) activates Push-to-Talk with live visual waveform/level meter
 *  - Live transcript bubble + Sherpas audio response
 *  - 1-tap shortcut to open Calibration Micro-Card on detected terms
 */

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
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
  audioLevel?: number;
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
  audioLevel = 0,
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
  const pressStartTimeRef = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const sampleQuestions = HOUSEHOLD_QUESTIONS[caseId] || DEFAULT_QUESTIONS;

  // Sync opened state when suggestions or replies arrive from the voice session
  useEffect(() => {
    if (showSuggestions || responseMessage || guardRedirect) {
      setOpened(true);
    }
  }, [showSuggestions, responseMessage, guardRedirect]);

  function handleSubmitCustom(e: React.FormEvent) {
    e.preventDefault();
    const clean = customText.trim();
    if (!clean) return;
    onSelectSuggestion?.(clean);
    setCustomText('');
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();

    // If currently speaking, a tap stops/mutes speech
    if (voiceState === 'speaking') {
      onStopSpeaking?.();
      return;
    }

    pointerIdRef.current = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore if setPointerCapture fails on certain virtual elements
    }

    isPressingRef.current = true;
    pressStartTimeRef.current = performance.now();
    onPressStart();
  }

  function handlePointerUp(e: React.PointerEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (pointerIdRef.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(pointerIdRef.current)) {
          e.currentTarget.releasePointerCapture(pointerIdRef.current);
        }
      } catch {
        // Ignore
      }
      pointerIdRef.current = null;
    }

    if (!isPressingRef.current) return;
    isPressingRef.current = false;

    const duration = performance.now() - pressStartTimeRef.current;
    if (duration < 250) {
      // Quick single tap (<250ms): toggle suggestions / input modal
      onPressEnd();
      setOpened((prev) => !prev);
    } else {
      // Held to talk (>=250ms): commit voice question
      setOpened(true);
      onPressEnd();
    }
  }

  function handlePointerCancel(e: React.PointerEvent<HTMLButtonElement>) {
    if (pointerIdRef.current !== null) {
      try {
        if (e.currentTarget.hasPointerCapture(pointerIdRef.current)) {
          e.currentTarget.releasePointerCapture(pointerIdRef.current);
        }
      } catch {
        // Ignore
      }
      pointerIdRef.current = null;
    }

    if (isPressingRef.current) {
      isPressingRef.current = false;
      onPressEnd();
    }
  }

  function handleLostPointerCapture(_e: React.PointerEvent<HTMLButtonElement>) {
    pointerIdRef.current = null;
    if (isPressingRef.current) {
      isPressingRef.current = false;
      onPressEnd();
    }
  }

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const hasContent = opened || isListening;

  useEffect(() => {
    onOverlayChange?.(hasContent);
  }, [hasContent, onOverlayChange]);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* ── Speech / Suggestion Modal Bubble ──────────────────────────────── */}
      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, y: compact ? 8 : -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: compact ? 8 : -8 }}
            transition={{ duration: 0.15 }}
            className={`absolute ${compact ? 'top-full right-0 mt-3' : 'bottom-full mb-3'} w-[340px] max-w-[calc(100vw-2rem)] max-h-[70dvh] overflow-y-auto p-3.5 rounded-2xl text-xs border bg-slate-900 border-slate-700 text-white z-50 space-y-2.5 shadow-2xl`}
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
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                      <span
                        className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping"
                        style={{
                          transform: `scale(${1 + audioLevel * 1.5})`,
                        }}
                      />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                    </span>
                    <span className="text-rose-300">Listening to your voice...</span>
                    {/* Live equalizer bars reflecting RMS level */}
                    <div className="flex items-center gap-0.5 ml-2 h-4 px-1.5 py-0.5 rounded bg-rose-950/60 border border-rose-800/50">
                      <span
                        className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(3, Math.min(14, 3 + audioLevel * 16))}px` }}
                      />
                      <span
                        className="w-1 bg-rose-300 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(4, Math.min(14, 4 + audioLevel * 22))}px` }}
                      />
                      <span
                        className="w-1 bg-rose-400 rounded-full transition-all duration-75"
                        style={{ height: `${Math.max(3, Math.min(14, 3 + audioLevel * 14))}px` }}
                      />
                    </div>
                  </div>
                ) : isSpeaking ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
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
                  type="button"
                  onClick={() => {
                    setOpened(false);
                    onClosePopup();
                  }}
                  className="min-w-11 min-h-11 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors"
                  aria-label="Close voice assistant"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Listening Live Transcript */}
            {isListening && (
              <div className="space-y-1">
                <p className="text-xs text-rose-200 font-medium leading-relaxed italic">
                  {transcript ? <FinancialText text={transcript} /> : 'Listening... Say your question now'}
                </p>
                <p className="text-[10px] text-slate-400">Release button when finished speaking</p>
              </div>
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
                    type="button"
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

            {/* Suggestion Chips and Text Input */}
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
        {/* Animated pulsating halo when listening to user's voice */}
        {isListening && (
          <span
            className="absolute -inset-1 rounded-full bg-rose-500/30 blur-sm pointer-events-none transition-transform duration-75"
            style={{
              transform: `scale(${1 + audioLevel * 0.25})`,
              opacity: Math.max(0.4, Math.min(1, 0.4 + audioLevel * 0.8)),
            }}
          />
        )}

        <motion.button
          type="button"
          transition={{ duration: 0.12 }}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onLostPointerCapture={handleLostPointerCapture}
          onContextMenu={(e) => e.preventDefault()}
          disabled={disabled}
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            WebkitTouchCallout: 'none',
          }}
          className={`relative flex items-center gap-2 min-h-11 ${compact ? 'px-3' : 'px-4'} py-2 rounded-full text-xs font-bold border transition-all cursor-pointer select-none ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 ring-4 ring-rose-500/20'
              : isSpeaking
              ? 'bg-blue-600 text-white border-blue-400'
              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:border-slate-500 hover:text-white'
          }`}
          aria-label={isListening ? 'Release to ask' : 'Hold to ask'}
        >
          {isListening ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white text-white" />
              {/* Dynamic sound wave bars inside button */}
              <div className="flex items-center gap-0.5 h-3.5" aria-hidden="true">
                <span
                  className="w-0.5 bg-white/90 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(3, Math.min(12, 3 + audioLevel * 14))}px` }}
                />
                <span
                  className="w-0.5 bg-white rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(4, Math.min(12, 4 + audioLevel * 18))}px` }}
                />
                <span
                  className="w-0.5 bg-white/90 rounded-full transition-all duration-75"
                  style={{ height: `${Math.max(3, Math.min(12, 3 + audioLevel * 12))}px` }}
                />
              </div>
              <span className={compact ? 'sr-only' : undefined}>Release to Send</span>
            </>
          ) : isSpeaking ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
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
