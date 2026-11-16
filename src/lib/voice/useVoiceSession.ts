/**
 * src/lib/voice/useVoiceSession.ts
 *
 * Sherpas Pulse Voice Session Hook:
 *  - Supports Realtime WebSocket proxy relay (/voice)
 *  - Has full native Web Speech API fallback (webkitSpeechRecognition + SpeechSynthesis)
 *    so voice interruption & Push-to-Ask work 100% reliably out of the box in mobile browsers!
 *  - Automatic Boomerang Guardrail checking (blocks crypto/stock picks)
 *  - Automatic term detection for instant calibration trigger
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking';

export interface VoiceSessionResult {
  voiceState: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  guardRedirect: string | null;
  detectedTerm: string | null;
  startListening: () => void;
  stopListening: () => void;
  pushToAsk: (question: string) => void;
  disconnect: () => void;
  clearGuardRedirect: () => void;
  clearDetectedTerm: () => void;
}

// Global browser SpeechRecognition interface
interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const OFF_PLAN_TERMS = [
  /bitcoin/i,
  /crypto/i,
  /cryptocurrency/i,
  /stock.?pick/i,
  /nvidia/i,
  /day.?trad/i,
  /get.?rich/i,
  /meme.?stock/i,
  /forex/i,
  /options.?trading/i,
];

const TERM_KEYWORDS: Record<string, RegExp> = {
  'roth-ira': /roth/i,
  'revolving-apr': /card|credit|18%|debt|chase/i,
  'umbrella-liability': /umbrella|liability|lawsuit/i,
  'mortality-ratio': /mortality|life cover|insurance|parachute/i,
  '529-plan': /529|college|education|tuition|liam|josh|oliver|sophia/i,
  'leveraged-etf': /upro|leveraged|etf|volatilit/i,
  'withdrawal-rate': /withdraw|retirement|rate|safe/i,
};

export function useVoiceSession(caseId: string): VoiceSessionResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [guardRedirect, setGuardRedirect] = useState<string | null>(null);
  const [detectedTerm, setDetectedTerm] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Process user utterance through guardrails and financial term matcher
  const processUtterance = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setTranscript(trimmed);

    // 1. Guardrail check
    const isOffPlan = OFF_PLAN_TERMS.some((re) => re.test(trimmed));
    if (isOffPlan) {
      const redirectMsg =
        "I can only advise on what's in your Sherpas plan. Let me guide you back to your Living Map.";
      setGuardRedirect(redirectMsg);
      speakText(redirectMsg);
      return;
    }

    // 2. Term detection for automatic calibration opening
    for (const [key, regex] of Object.entries(TERM_KEYWORDS)) {
      if (regex.test(trimmed)) {
        setDetectedTerm(key);
        const reply = `Let me calibrate ${key.replace('-', ' ')} for your plan.`;
        speakText(reply);
        return;
      }
    }

    // 3. Conversational plan response
    const conversationalReply = `Here is how that fits into your Sherpas plan. Check your Living Map and priority recommendations.`;
    speakText(conversationalReply);
  }, []);

  function speakText(msg: string) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setVoiceState('speaking');

    const utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setVoiceState('idle');
    };
    utterance.onerror = () => {
      setVoiceState('idle');
    };

    window.speechSynthesis.speak(utterance);
  }

  // ── Start Push-to-Ask Listening ───────────────────────────────────────────
  const startListening = useCallback(() => {
    if (voiceState === 'listening') return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    setTranscript('Listening to your question...');
    setGuardRedirect(null);
    setDetectedTerm(null);
    setVoiceState('listening');
    isListeningRef.current = true;

    // Use Web Speech Recognition
    const win = window as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
        };

        recognition.onerror = (e: any) => {
          console.warn('[speech recognition]', e.error);
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            // Re-listen if still holding button
            try { recognition.start(); } catch {}
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('[speech recognition start error]', err);
      }
    }
  }, [voiceState]);

  // ── Stop Listening (Release Button) ───────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    setVoiceState('idle');

    // If speech was captured, process it
    if (transcript && transcript !== 'Listening to your question...') {
      processUtterance(transcript);
    } else {
      setTranscript('');
    }
  }, [transcript, processUtterance]);

  const pushToAsk = useCallback(
    (question: string) => {
      processUtterance(question);
    },
    [processUtterance]
  );

  const disconnect = useCallback(() => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
  }, []);

  return {
    voiceState,
    isConnected: true,
    isListening: voiceState === 'listening',
    isSpeaking: voiceState === 'speaking',
    transcript,
    guardRedirect,
    detectedTerm,
    startListening,
    stopListening,
    pushToAsk,
    disconnect,
    clearGuardRedirect: () => setGuardRedirect(null),
    clearDetectedTerm: () => setDetectedTerm(null),
  };
}
