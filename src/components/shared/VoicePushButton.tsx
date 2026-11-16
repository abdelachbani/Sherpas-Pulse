/**
 * src/components/shared/VoicePushButton.tsx
 *
 * Push-to-Ask voice button for Sherpas Pulse:
 *  - Ergonomic mobile dock design (non-intrusive, never covers story CTAs)
 *  - Touch & mouse hold-to-ask interactions
 *  - Real-time pulse animation while listening
 *  - Speech feedback bubble with guardrail notice
 */

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Square, Bot, Sparkles, AlertCircle } from 'lucide-react';
import type { VoiceState } from '../../lib/voice/useVoiceSession';

interface Props {
  voiceState: VoiceState;
  transcript: string;
  guardRedirect?: string | null;
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
}

export function VoicePushButton({
  voiceState,
  transcript,
  guardRedirect,
  onPressStart,
  onPressEnd,
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

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Transcript or Guardrail Notification Bubble */}
      <AnimatePresence>
        {(transcript || guardRedirect) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`absolute bottom-full mb-3 max-w-[280px] p-3 rounded-2xl text-xs shadow-2xl backdrop-blur-md border ${
              guardRedirect
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/50'
                : isListening
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-slate-900/90 text-slate-100 border-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold mb-0.5 text-[10px] uppercase tracking-wider">
              {guardRedirect ? (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Guardrail Redirect</span>
                </>
              ) : isListening ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span>Listening...</span>
                </>
              ) : (
                <>
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sherpas Voice</span>
                </>
              )}
            </div>
            <p className="leading-snug">{guardRedirect || transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactile Push-to-Ask Button Pill */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing ring while listening */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full bg-rose-500/30"
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
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-lg border transition-all cursor-pointer ${
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
              <Bot className="w-3.5 h-3.5 text-indigo-300" />
              <span>Responding...</span>
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
