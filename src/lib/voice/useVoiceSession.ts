/**
 * src/lib/voice/useVoiceSession.ts
 *
 * Robust, Zero-Fail Voice Session Hook for Sherpas Pulse:
 *  - Real-time Speech Recognition (SpeechRecognition / webkitSpeechRecognition)
 *  - Multilingual keyword matching (English & Spanish query understanding)
 *  - Household-specific plan grounding (Timothy & Melanie, Daniel & Emily, Michael, Samantha)
 *  - Automatic Boomerang Guardrail (intercepts crypto/bitcoin/stock picks)
 *  - Automatic financial term detection triggering micro-calibration
 *  - Browser SpeechSynthesis narration with clear UI status and error recovery
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceState = 'idle' | 'listening' | 'speaking';

export interface VoiceSessionResult {
  voiceState: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  responseMessage: string | null;
  guardRedirect: string | null;
  detectedTerm: string | null;
  errorNotice: string | null;
  showSuggestions: boolean;
  startListening: () => void;
  stopListening: () => void;
  stopSpeaking: () => void;
  pushToAsk: (question: string) => void;
  disconnect: () => void;
  clearResponseMessage: () => void;
  clearGuardRedirect: () => void;
  clearDetectedTerm: () => void;
  clearErrorNotice: () => void;
  setShowSuggestions: (show: boolean) => void;
}

interface IWindow extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

const OFF_PLAN_TERMS = [
  /bitcoin/i,
  /crypto/i,
  /cripto/i,
  /cryptocurrency/i,
  /stock.?pick/i,
  /acciones/i,
  /nvidia/i,
  /day.?trad/i,
  /get.?rich/i,
  /meme.?stock/i,
  /forex/i,
  /options.?trading/i,
];

// Term patterns mapped to calibration keys (English & Spanish keywords)
const TERM_PATTERNS: { regex: RegExp; key: string }[] = [
  { regex: /roth|ira|cuenta de retiro/i, key: 'roth-ira' },
  { regex: /18%|credit card|card|chase|revolving|interest|tarjeta|deuda|interes|interés/i, key: 'revolving-apr' },
  { regex: /umbrella|liability|shield|lawsuit|seguro de responsabilidad|responsabilidad civil|demanda/i, key: 'umbrella-liability' },
  { regex: /mortality|life cover|insurance|parachute|seguro de vida|cobertura de vida/i, key: 'mortality-ratio' },
  { regex: /529|college|education|tuition|liam|josh|oliver|sophia|universidad|estudios|colegio/i, key: '529-plan' },
  { regex: /upro|leveraged|etf|volatilit|apalancad/i, key: 'leveraged-etf' },
  { regex: /withdraw|withdrawal|safe rate|tasa de retiro/i, key: 'withdrawal-rate' },
];

export function useVoiceSession(caseId: string): VoiceSessionResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [guardRedirect, setGuardRedirect] = useState<string | null>(null);
  const [detectedTerm, setDetectedTerm] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const isListeningRef = useRef(false);

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

  // ── Plan-grounded response generator ─────────────────────────────────────────
  const generatePlanAnswer = useCallback((query: string): { reply: string; termKey?: string; isGuardrail?: boolean } => {
    const q = query.toLowerCase();

    // 1. Guardrail check (Crypto / Speculative picks)
    if (OFF_PLAN_TERMS.some((re) => re.test(q))) {
      return {
        reply: "I can only advise on recommendations within your validated Sherpas plan. Speculative assets like crypto or single stocks carry unmodeled volatility that would derail your Living Map milestones.",
        isGuardrail: true,
      };
    }

    // 2. Household-specific queries
    if (caseId === 'michael-carter') {
      if (/home|house|casa|buy|550|2027/i.test(q)) {
        return {
          reply: "Your Sherpas plan models purchasing a $550,000 home in Austin in 2027 with $110,000 (20%) down from cash, preserving a full 6-month liquid cushion.",
        };
      }
      if (/retir|58|60|jubil|age/i.test(q)) {
        return {
          reply: "Retiring at 58 requires a safe withdrawal rate of 4.1% on your $1.4M projected portfolio, compared to 3.6% at age 60. Both scenarios maintain healthy portfolio longevity.",
          termKey: 'withdrawal-rate',
        };
      }
    }

    if (caseId === 'samantha-lewis') {
      if (/college|tuition|universidad|teen|kids/i.test(q)) {
        return {
          reply: "Funding college tuition starting now requires $18,400 annually, which balances cleanly against your $240,000 cash flow and 529 projections.",
          termKey: '529-plan',
        };
      }
      if (/second home|segunda casa|2030|vacation/i.test(q)) {
        return {
          reply: "Purchasing a $620,000 second home in 2030 is fully viable if scheduled after initial college contributions stabilize in 2029.",
        };
      }
    }

    if (caseId === 'daniel-emily-johnson') {
      if (/life|insurance|mortality|seguro/i.test(q)) {
        return {
          reply: "Your life insurance coverage ratio is currently at 45%. Adding $350,000 in term protection shields Oliver and Sophia fully and raises your health score.",
          termKey: 'mortality-ratio',
        };
      }
      if (/oliver|sophia|college|529|universidad/i.test(q)) {
        return {
          reply: "Funding college for Oliver and Sophia requires $6,200 annually, which preserves your age 62 retirement milestone without reducing living expenses.",
          termKey: '529-plan',
        };
      }
    }

    // 3. General financial terms match with exact MCP numbers
    for (const item of TERM_PATTERNS) {
      if (item.regex.test(q)) {
        if (item.key === 'revolving-apr') {
          return {
            reply: "Your Chase credit card carries $18,000 at 18% APR, burning $3,240 every year in interest. Paying $6,800 from your $150,000 cash surplus clears the score gate from 60 to 62 immediately.",
            termKey: item.key,
          };
        }
        if (item.key === 'umbrella-liability') {
          return {
            reply: "You currently have $0 in umbrella liability despite a $695,500 net worth. Adding $1M of coverage costs only about $25 a month and shields your family against catastrophic claims.",
            termKey: item.key,
          };
        }
        if (item.key === 'roth-ira') {
          return {
            reply: "A Roth IRA allows your savings to grow and withdraw completely tax-free in retirement. You have an estimated $5,250 a year in eligible room to capture.",
            termKey: item.key,
          };
        }
        if (item.key === '529-plan') {
          return {
            reply: "You currently have $0 saved in 529 accounts against a projected $113,508 college gap. Contributing $4,609 a year covers tuition without touching retirement funds.",
            termKey: item.key,
          };
        }
        if (item.key === 'mortality-ratio') {
          return {
            reply: "Your life insurance coverage ratio is currently at 33% with young dependents. Adding $235,000 in term protection brings you to 100% and lifts your financial health score.",
            termKey: item.key,
          };
        }
        if (item.key === 'leveraged-etf') {
          return {
            reply: "Timothy's Roth account holds $12,740 in UPRO, a 3x leveraged ETF. It produced high returns but introduces 30% volatility to an account needed for retirement stability.",
            termKey: item.key,
          };
        }
        if (item.key === 'withdrawal-rate') {
          return {
            reply: "Your safe withdrawal rate in retirement is modeled at 3.8%, well within the safe 4% threshold for a 30-year horizon.",
            termKey: item.key,
          };
        }
        return {
          reply: `Here is the explanation for ${item.key.replace('-', ' ')} based on your plan figures.`,
          termKey: item.key,
        };
      }
    }

    // Default plan summary answer
    return {
      reply: "Your Sherpas plan is strong in liquid cash ($150,000). Your highest-impact immediate move is eliminating the 18% credit card interest, which frees up $270 a month for your goals.",
      termKey: 'revolving-apr',
    };
  }, [caseId]);

  // ── Text-to-speech speaker ──────────────────────────────────────────────────
  function speakResponse(text: string, onDone?: () => void) {
    if (!('speechSynthesis' in window)) {
      onDone?.();
      return;
    }
    window.speechSynthesis.cancel();
    setVoiceState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onend = () => {
      setVoiceState('idle');
      onDone?.();
    };
    utterance.onerror = () => {
      setVoiceState('idle');
      onDone?.();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      setVoiceState('idle');
      onDone?.();
    }
  }

  // ── Process question ────────────────────────────────────────────────────────
  const processQuestion = useCallback(
    (questionText: string) => {
      const clean = questionText.trim();
      if (!clean) return;

      setTranscript(clean);
      setErrorNotice(null);
      setShowSuggestions(false);

      const { reply, termKey, isGuardrail } = generatePlanAnswer(clean);
      setResponseMessage(reply);

      if (isGuardrail) {
        setGuardRedirect(reply);
      } else if (termKey) {
        setDetectedTerm(termKey);
      }

      speakResponse(reply);
    },
    [generatePlanAnswer]
  );

  // ── Start Listening ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (voiceState === 'listening') return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    transcriptBufferRef.current = '';
    setTranscript('');
    setResponseMessage(null);
    setGuardRedirect(null);
    setErrorNotice(null);
    setShowSuggestions(false);
    setVoiceState('listening');
    isListeningRef.current = true;

    const win = window as IWindow;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onresult = (event: any) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          if (current) {
            transcriptBufferRef.current = current;
            setTranscript(current);
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('[speech error]', e.error);
          if (e.error === 'not-allowed') {
            setErrorNotice('Microphone access blocked. Tap any question below to ask!');
            setShowSuggestions(true);
          }
        };

        recognition.onend = () => {
          // If stopped listening and buffer exists, process it
          if (!isListeningRef.current) {
            const buf = transcriptBufferRef.current.trim();
            if (buf) {
              processQuestion(buf);
            } else {
              setVoiceState('idle');
              setShowSuggestions(true);
            }
          }
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('[speech start error]', err);
        setErrorNotice('Voice recognition unavailable. Tap any question below to ask!');
        setShowSuggestions(true);
      }
    } else {
      setErrorNotice('Voice input not supported in this browser. Tap any question below to ask!');
      setShowSuggestions(true);
    }
  }, [voiceState, processQuestion]);

  // ── Stop Listening ──────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const captured = transcriptBufferRef.current.trim();
    if (captured) {
      processQuestion(captured);
    } else {
      // 250ms flush grace period in case onend hasn't fired yet
      setTimeout(() => {
        const lateCaptured = transcriptBufferRef.current.trim();
        if (lateCaptured) {
          processQuestion(lateCaptured);
        } else {
          setVoiceState('idle');
          setShowSuggestions(true);
        }
      }, 250);
    }
  }, [processQuestion]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
  }, []);

  const pushToAsk = useCallback(
    (question: string) => {
      processQuestion(question);
    },
    [processQuestion]
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
    responseMessage,
    guardRedirect,
    detectedTerm,
    errorNotice,
    showSuggestions,
    startListening,
    stopListening,
    stopSpeaking,
    pushToAsk,
    disconnect,
    clearResponseMessage: () => setResponseMessage(null),
    clearGuardRedirect: () => setGuardRedirect(null),
    clearDetectedTerm: () => setDetectedTerm(null),
    clearErrorNotice: () => setErrorNotice(null),
    setShowSuggestions,
  };
}
