/**
 * src/components/shared/VoicePushButton.tsx
 *
 * Push-to-Ask mic button for Sherpas Pulse.
 * - 72px round button, fixed bottom-center
 * - Hold (touchstart/mousedown) → listening; release → AI responds
 * - State colours: idle=slate, listening=red+pulsing ring, speaking=blue+wave
 * - Transcript bubble above button while speaking
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VoiceState } from '../../lib/voice/useVoiceSession';

interface Props {
  voiceState: VoiceState;
  transcript: string;
  onPressStart: () => void;
  onPressEnd: () => void;
  disabled?: boolean;
}

export function VoicePushButton({ voiceState, transcript, onPressStart, onPressEnd, disabled }: Props) {
  const pressRef = useRef(false);

  function handlePressStart(e: React.TouchEvent | React.MouseEvent) {
    if (disabled) return;
    e.preventDefault();
    if (pressRef.current) return;
    pressRef.current = true;
    onPressStart();
  }

  function handlePressEnd(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (!pressRef.current) return;
    pressRef.current = false;
    onPressEnd();
  }

  // Safety: release on window blur
  useEffect(() => {
    const release = () => {
      if (pressRef.current) {
        pressRef.current = false;
        onPressEnd();
      }
    };
    window.addEventListener('blur', release);
    return () => window.removeEventListener('blur', release);
  }, [onPressEnd]);

  const isListening = voiceState === 'listening';
  const isSpeaking = voiceState === 'speaking';
  const isConnecting = voiceState === 'connecting';

  const buttonBg = isListening
    ? 'bg-red-500'
    : isSpeaking
    ? 'bg-blue-500'
    : isConnecting
    ? 'bg-slate-400'
    : 'bg-slate-700';

  const icon = isListening ? '⏹️' : isSpeaking ? '🤖' : isConnecting ? '⏳' : '🎙️';

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 select-none">
      {/* Transcript bubble */}
      <AnimatePresence>
        {isSpeaking && transcript && (
          <motion.div
            key="bubble"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="max-w-[280px] bg-slate-800 text-white text-sm rounded-2xl px-4 py-2 shadow-lg border border-slate-600"
          >
            {transcript}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulsing ring when listening */}
      <div className="relative flex items-center justify-center">
        {isListening && (
          <>
            <motion.span
              className="absolute rounded-full bg-red-500 opacity-30"
              style={{ width: 72, height: 72 }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.span
              className="absolute rounded-full bg-red-500 opacity-20"
              style={{ width: 72, height: 72 }}
              animate={{ scale: [1, 1.9, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            />
          </>
        )}

        {/* Wave rings when speaking */}
        {isSpeaking && (
          <>
            {[0, 0.3, 0.6].map((delay) => (
              <motion.span
                key={delay}
                className="absolute rounded-full bg-blue-500 opacity-25"
                style={{ width: 72, height: 72 }}
                animate={{ scale: [1, 1.6], opacity: [0.25, 0] }}
                transition={{ duration: 1.0, repeat: Infinity, ease: 'easeOut', delay }}
              />
            ))}
          </>
        )}

        {/* Main button */}
        <motion.button
          className={`w-[72px] h-[72px] rounded-full ${buttonBg} text-white text-2xl flex items-center justify-center shadow-xl transition-colors duration-200 touch-none cursor-pointer`}
          whileTap={{ scale: 0.9 }}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          onTouchCancel={handlePressEnd}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onMouseLeave={handlePressEnd}
          disabled={disabled || isConnecting}
          aria-label={isListening ? 'Stop listening' : 'Hold to ask'}
        >
          {icon}
        </motion.button>
      </div>

      {/* Label */}
      <span className="text-xs text-slate-400 pointer-events-none">
        {isListening
          ? 'Release to send'
          : isSpeaking
          ? 'Responding...'
          : isConnecting
          ? 'Connecting...'
          : 'Hold to ask'}
      </span>
    </div>
  );
}
