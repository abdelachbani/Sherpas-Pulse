/**
 * src/components/shared/VoiceIndicator.tsx
 *
 * Minimal always-visible voice state chip (top-right of stories).
 * Tapping it triggers the VoicePushButton flow by calling onActivate.
 */

import { motion } from 'framer-motion';
import type { VoiceState } from '../../lib/voice/useVoiceSession';

interface Props {
  voiceState: VoiceState;
  onActivate: () => void;
}

export function VoiceIndicator({ voiceState, onActivate }: Props) {
  const configs: Record<VoiceState, { label: string; color: string; pulse: boolean }> = {
    idle:       { label: '🔇 Tap to ask', color: 'bg-slate-700 text-slate-300', pulse: false },
    connecting: { label: '⏳ Connecting...', color: 'bg-slate-600 text-slate-200', pulse: false },
    connected:  { label: '🎙️ Connected', color: 'bg-emerald-800 text-emerald-200', pulse: false },
    listening:  { label: '🎙️ Listening...', color: 'bg-red-700 text-white', pulse: true },
    speaking:   { label: '🤖 Responding...', color: 'bg-blue-700 text-white', pulse: true },
  };

  const { label, color, pulse } = configs[voiceState];

  return (
    <motion.button
      className={`${color} text-xs font-medium px-3 py-1 rounded-full shadow select-none`}
      onClick={onActivate}
      animate={pulse ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
      transition={pulse ? { duration: 1.2, repeat: Infinity } : {}}
      aria-label={label}
    >
      {label}
    </motion.button>
  );
}
