/**
 * src/components/voice/VoiceAssistantModal.tsx
 *
 * Sherpas Voice & Calibration Hub (Push-to-Ask & Zero-Prompt Assistant):
 *  - Slide-up bottom sheet with backdrop overlay that never overlaps story elements
 *  - Active speech recognition with live visual waveform and transcript
 *  - Browser SpeechSynthesis narration with mute/pause controls
 *  - One-tap quick question chips customized for the active household
 *  - Instant text question input with Send button for quiet environments
 *  - Plan-grounded answers with exact MCP numbers and Grounding Badge
 *  - Boomerang Guardrail router (elegantly redirects speculative/crypto questions)
 *  - 1-Tap shortcut to open the exact Calibration Micro-Card
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  Square,
  Bot,
  AlertCircle,
  X,
  Sparkles,
  Send,
  Volume2,
  VolumeX,
  ShieldCheck,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import type { VoiceState } from '../../lib/voice/useVoiceSession';

interface Props {
  isOpen: boolean;
  caseId: string;
  voiceState: VoiceState;
  transcript: string;
  responseMessage: string | null;
  guardRedirect: string | null;
  detectedTerm: string | null;
  errorNotice: string | null;
  onStartListening: () => void;
  onStopListening: () => void;
  onAskQuestion: (query: string) => void;
  onStopSpeaking: () => void;
  onOpenCalibration: (termKey: string) => void;
  onClose: () => void;
}

// Tailored sample questions per household
const HOUSEHOLD_QUESTIONS: Record<
  string,
  { icon: string; label: string; query: string }[]
> = {
  'timothy-melanie-weah': [
    { icon: '💳', label: '18% Credit Card', query: 'Why pay off the 18% Chase card first?' },
    { icon: '🛡️', label: 'Umbrella Liability', query: 'What is umbrella liability insurance?' },
    { icon: '🎓', label: '529 College Plan', query: 'How does the 529 college plan work for Liam & Josh?' },
    { icon: '🪙', label: 'What about Bitcoin?', query: 'Should I invest in Bitcoin or crypto?' },
  ],
  'daniel-emily-johnson': [
    { icon: '🛡️', label: 'Life Insurance Parachute', query: 'Why increase life insurance coverage?' },
    { icon: '🎓', label: 'Oliver & Sophia College', query: 'Can we fund college and retire at 62?' },
    { icon: '💳', label: 'Cash Optimization', query: 'How should we allocate our cash surplus?' },
    { icon: '🪙', label: 'Single Stock Picks', query: 'Should we buy Nvidia or tech stocks?' },
  ],
  'michael-carter': [
    { icon: '🏡', label: '$550k Home in 2027', query: 'Can I afford to buy a $550,000 home in 2027?' },
    { icon: '⏳', label: 'Retiring at 58 vs 60', query: 'What is the impact of retiring at 58 vs 60?' },
    { icon: '🛡️', label: 'Umbrella Protection', query: 'Do I need umbrella liability insurance?' },
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

export function VoiceAssistantModal({
  isOpen,
  caseId,
  voiceState,
  transcript,
  responseMessage,
  guardRedirect,
  detectedTerm,
  errorNotice,
  onStartListening,
  onStopListening,
  onAskQuestion,
  onStopSpeaking,
  onOpenCalibration,
  onClose,
}: Props) {
  const [typedQuestion, setTypedQuestion] = useState('');
  const isPressingMicRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const sampleQuestions = HOUSEHOLD_QUESTIONS[caseId] || DEFAULT_QUESTIONS;
  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';

  // Handle typed submission
  function handleTypedSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = typedQuestion.trim();
    if (!q) return;
    onAskQuestion(q);
    setTypedQuestion('');
  }

  // Handle push-to-talk press
  function handleMicStart(e: React.TouchEvent | React.MouseEvent) {
    e.stopPropagation();
    if (isPressingMicRef.current) return;
    isPressingMicRef.current = true;
    onStartListening();
  }

  function handleMicEnd(e: React.TouchEvent | React.MouseEvent) {
    e.stopPropagation();
    if (!isPressingMicRef.current) return;
    isPressingMicRef.current = false;
    onStopListening();
  }

  // Release mic if mouse leaves or window blurs
  useEffect(() => {
    const handleBlur = () => {
      if (isPressingMicRef.current) {
        isPressingMicRef.current = false;
        onStopListening();
      }
    };
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [onStopListening]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm select-none"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="w-full max-w-[420px] mx-auto bg-slate-900 border-t border-slate-700/80 rounded-t-3xl p-4 sm:p-5 text-white shadow-2xl max-h-[88vh] overflow-y-auto no-scrollbar flex flex-col justify-between"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Top Drag Handle & Close Bar ───────────────────────────────── */}
          <div>
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <Bot className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Sherpas Voice Assistant</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                      Zero-Prompt
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ask doubts out loud, tap any topic, or type below
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Voice State Banner / Live Waveform ────────────────────────── */}
            <div className="my-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {isListening ? (
                <div className="space-y-2 py-1">
                  <div className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                      Listening to your voice...
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-1 h-6">
                    {[40, 70, 95, 60, 85, 45, 90, 65, 35].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-rose-500 rounded-full"
                        animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.3}%`] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.07 }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-rose-100 italic font-medium px-2">
                    {transcript ? `"${transcript}"` : 'Say your question now...'}
                  </p>
                </div>
              ) : isSpeaking ? (
                <div className="space-y-1.5 py-1 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      <span>Speaking Sherpas Answer...</span>
                    </div>
                    <button
                      onClick={onStopSpeaking}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                    >
                      <VolumeX className="w-3 h-3" />
                      <span>Mute voice</span>
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-1 h-4">
                    {[30, 60, 80, 50, 70, 40, 75, 55, 30].map((h, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-indigo-400 rounded-full"
                        animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.4}%`] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.08 }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Hold mic button to speak, or tap a question</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Every answer is strictly grounded in your verified MCP plan numbers
                  </div>
                </div>
              )}
            </div>

            {/* Error or Notice message */}
            {errorNotice && !isListening && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{errorNotice}</span>
              </motion.div>
            )}

            {/* ── AI Response Card (Plan Grounded or Guardrail) ─────────────── */}
            {(responseMessage || guardRedirect) && !isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`mb-3 p-3.5 rounded-2xl border text-xs space-y-2 ${
                  guardRedirect
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-100'
                    : 'bg-slate-950/90 border-indigo-500/30 text-slate-100'
                }`}
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-[11px]">
                    {guardRedirect ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300">Boomerang Guardrail Router</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">100% Plan Grounded Answer</span>
                      </>
                    )}
                  </div>
                  {transcript && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                      "{transcript}"
                    </span>
                  )}
                </div>

                <p className="text-[12px] leading-relaxed font-normal text-slate-200">
                  {guardRedirect || responseMessage}
                </p>

                {/* Detected Term Calibration Shortcut */}
                {detectedTerm && (
                  <button
                    onClick={() => {
                      onOpenCalibration(detectedTerm);
                      onClose();
                    }}
                    className="w-full mt-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Everyday Analogy & MCP Data</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                  </button>
                )}
              </motion.div>
            )}

            {/* ── 1-Tap Quick Question Chips ──────────────────────────────── */}
            <div className="space-y-1.5 mb-3">
              <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
                <span>Quick Plan Questions:</span>
                <span className="text-[10px] text-indigo-400 font-normal">Tap to ask instantly</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sampleQuestions.map((q) => (
                  <button
                    key={q.label}
                    onClick={() => onAskQuestion(q.query)}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-left transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                      <span>{q.icon}</span>
                      <span className="truncate">{q.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Text Question Input ─────────────────────────────────────── */}
            <form onSubmit={handleTypedSubmit} className="flex gap-2 mb-3">
              <input
                ref={inputRef}
                type="text"
                value={typedQuestion}
                onChange={(e) => setTypedQuestion(e.target.value)}
                placeholder="Type any doubt about your plan..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!typedQuestion.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Send question"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* ── Bottom Tactile Microphone & Resume Button ──────────────────── */}
          <div className="pt-2 border-t border-slate-800 flex items-center gap-3">
            {/* Hold to speak tactile button */}
            <button
              onTouchStart={handleMicStart}
              onTouchEnd={handleMicEnd}
              onTouchCancel={handleMicEnd}
              onMouseDown={handleMicStart}
              onMouseUp={handleMicEnd}
              onMouseLeave={handleMicEnd}
              className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer select-none active:scale-95 ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {isListening ? (
                <>
                  <Square className="w-4 h-4 fill-white text-white" />
                  <span>Release to Ask</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-white" />
                  <span>Hold to Speak Voice</span>
                </>
              )}
            </button>

            {/* Resume Plan Story */}
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Resume Story
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
