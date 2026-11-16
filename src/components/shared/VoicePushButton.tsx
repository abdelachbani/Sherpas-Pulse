/**
 * src/components/shared/VoicePushButton.tsx
 *
 * Push-to-Ask voice component for Sherpas Pulse:
 *  - Responsive bottom dock with safe margin
 *  - Touch & mouse hold-to-ask interactions
 *  - Live transcript bubble + Sherpas audio response
 *  - Quick suggestion chips if mic was quiet or quickly tapped
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Bot, AlertCircle, X, Sparkles } from 'lucide-react';
import type { VoiceState } from '../../lib/voice/useVoiceSession';

interface Props {
  voiceState: VoiceState;
  transcript: string;
  responseMessage?: string | null;
  guardRedirect?: string | null;
  showSuggestions?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  onSelectSuggestion?: (question: string) => void;
  onClosePopup?: () => void;
  disabled?: boolean;
}

const SAMPLE_QUESTIONS = [
  { icon: '💳', label: '18% Credit Card', query: 'Why pay off the 18% credit card first?' },
  { icon: '🛡️', label: 'Umbrella Liability', query: 'What is umbrella liability insurance?' },
  { icon: '🎓', label: '529 College Plan', query: 'How does the 529 college plan work?' },
  { icon: '🪙', label: 'What about Bitcoin?', query: 'Should I invest in Bitcoin or crypto?' },
];

export function VoicePushButton({
  voiceState,
  transcript,
  responseMessage,
  guardRedirect,
  showSuggestions = false,
  onPressStart,
  onPressEnd,
  onSelectSuggestion,
  onClosePopup,
  disabled,
}: Props) {
  const isPressingRef = useRef(false);

  function handleStart(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return;
    e.stopPropagation();
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
  const hasContent = Boolean(isListening || responseMessage || guardRedirect || showSuggestions);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* ── Speech / Suggestion Modal Bubble ──────────────────────────────── */}
      <AnimatePresence>
        {hasContent && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-3 w-[330px] p-3.5 rounded-3xl text-xs shadow-2xl backdrop-blur-xl border bg-slate-900/95 border-slate-700/80 text-white z-50 space-y-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
                {guardRedirect ? (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Guardrail Redirect</span>
                  </>
                ) : isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-rose-300">Listening to your voice...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-indigo-300">Sherpas Voice Answer</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-sky-300">Ask Your Sherpas Guide</span>
                  </>
                )}
              </div>

              {onClosePopup && (
                <button
                  onClick={onClosePopup}
                  className="p-1 rounded-full text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Listening Live Transcript */}
            {isListening && (
              <p className="text-xs text-rose-200 font-medium leading-relaxed italic">
                {transcript || 'Listening... Say your question now'}
              </p>
            )}

            {/* AI Response Message or Guardrail Notice */}
            {!isListening && (responseMessage || guardRedirect) && (
              <div className="space-y-1">
                {transcript && (
                  <div className="text-[10px] text-slate-400">
                    You asked: <span className="text-slate-200 italic">"{transcript}"</span>
                  </div>
                )}
                <p className="text-xs text-slate-100 leading-relaxed font-normal bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  {guardRedirect || responseMessage}
                </p>
              </div>
            )}

            {/* Suggestion Chips when mic was quiet or quick-tapped */}
            {!isListening && (!responseMessage || showSuggestions) && (
              <div className="space-y-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-semibold block">
                  Tap any question to ask instantly:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {SAMPLE_QUESTIONS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => onSelectSuggestion?.(q.query)}
                      className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-white flex items-center gap-1 truncate">
                        <span>{q.icon}</span>
                        <span>{q.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Push-to-Ask Dock Button ─────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-rose-500/40"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <motion.button
          whileTap={{ scale: 0.94 }}
          onTouchStart={handleStart}
          onTouchEnd={handleEnd}
          onTouchCancel={handleEnd}
          onMouseDown={handleStart}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          disabled={disabled}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-xl border transition-all cursor-pointer ${
            isListening
              ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/40 ring-4 ring-rose-500/20'
              : isSpeaking
              ? 'bg-indigo-600 text-white border-indigo-400 shadow-indigo-600/30 animate-pulse'
              : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:border-slate-500 hover:text-white backdrop-blur-md'
          }`}
          aria-label={isListening ? 'Release to ask' : 'Hold to ask'}
        >
          {isListening ? (
            <>
              <Square className="w-3.5 h-3.5 fill-white text-white" />
              <span>Release to Send</span>
            </>
          ) : isSpeaking ? (
            <>
              <Bot className="w-3.5 h-3.5 text-indigo-300 animate-spin" />
              <span>Speaking Answer...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-indigo-400" />
              <span>Hold to Ask</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
