/**
 * src/lib/voice/useVoiceSession.ts
 *
 * Robust, Zero-Fail Voice Session Hook for Sherpas Pulse:
 *  - Real-time Speech Recognition (SpeechRecognition / webkitSpeechRecognition)
 *  - Multilingual keyword matching (English & Spanish query understanding)
 *  - Household-specific plan grounding (Timothy & Melanie, Daniel & Emily, Michael, Samantha)
 *  - Automatic Boomerang Guardrail (intercepts crypto/bitcoin/stock picks)
 *  - Automatic financial term detection triggering micro-calibration
 *  - Browser SpeechSynthesis narration with Chrome garbage-collection protection
 *  - Instant fallback answer if microphone is quiet or fast-tapped (NEVER stays silent)
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

// Term patterns mapped to calibration keys (Comprehensive English & Spanish keywords)
const TERM_PATTERNS: { regex: RegExp; key: string }[] = [
  {
    regex: /(?:roth|ira|cuenta.?de.?retiro)/i,
    key: 'roth-ira',
  },
  {
    regex: /(?:18%|credit.?card|card|chase|revolving|interest|tarjeta|deuda|interes|interés|pago.?tarjeta)/i,
    key: 'revolving-apr',
  },
  {
    regex: /(?:umbrella|liability|shield|lawsuit|seguro.?de.?responsabilidad|responsabilidad.?civil|demanda|proteccion.?legal|protección)/i,
    key: 'umbrella-liability',
  },
  {
    regex: /(?:mortality|life.?cover|insurance|parachute|seguro.?de.?vida|cobertura.?de.?vida|fallecimiento|poliza.?vida|póliza)/i,
    key: 'mortality-ratio',
  },
  {
    regex: /(?:529|college|education|tuition|liam|josh|oliver|sophia|ethan|ava|universidad|estudios|colegio|matricula|matrícula|hijos)/i,
    key: '529-plan',
  },
  {
    regex: /(?:upro|leveraged|etf|volatilit|apalancad|fondo.?apalancado)/i,
    key: 'leveraged-etf',
  },
  {
    regex: /(?:withdraw|withdrawal|safe.?rate|tasa.?de.?retiro|retiro.?seguro|regla.?del.?4%|longevidad)/i,
    key: 'withdrawal-rate',
  },
];

// Retain active utterance to prevent Chrome's premature garbage collection bug
let activeUtteranceRef: SpeechSynthesisUtterance | null = null;

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
  const stopTimeoutRef = useRef<any>(null);
  const hasProcessedRef = useRef(false);
  const micBlockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) {
        clearTimeout(stopTimeoutRef.current);
      }
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
      if (/home|house|casa|buy|comprar|vivienda|550|2027/i.test(q)) {
        return {
          reply: "Your Sherpas plan models purchasing a $550,000 home in Austin in 2027 with $110,000 (20%) down from cash, preserving a full 6-month liquid cushion.",
        };
      }
      if (/retir|58|60|jubil|age|edad|pension|pensión/i.test(q)) {
        return {
          reply: "Retiring at 58 requires a safe withdrawal rate of 4.1% on your $1.4M projected portfolio, compared to 3.6% at age 60. Both scenarios maintain healthy portfolio longevity.",
          termKey: 'withdrawal-rate',
        };
      }
      if (/cash|dinero|ahorro|saldo|liquidez|savings|reservoir|fondo/i.test(q)) {
        return {
          reply: "You earn $180,000 in Austin, but your savings score is currently low. Your plan automates $1,500 monthly into a high-yield account to accumulate $54,000 for your 2027 down payment.",
        };
      }
    }

    if (caseId === 'samantha-lewis') {
      if (/college|tuition|universidad|estudios|colegio|ethan|ava|teen|kids|hijos/i.test(q)) {
        return {
          reply: "Funding college tuition starting now for Ethan and Ava requires $18,400 annually, which balances cleanly against your $240,000 cash flow and 529 projections.",
          termKey: '529-plan',
        };
      }
      if (/second home|segunda casa|2030|vacation|playa|vacaciones/i.test(q)) {
        return {
          reply: "Purchasing a $620,000 second home in 2030 is fully viable if scheduled after initial college contributions stabilize in 2029.",
        };
      }
      if (/deuda|debt|cash|dinero|ahorro|saldo|liquidez|fortress/i.test(q)) {
        return {
          reply: "You have a flawless 100/100 debt-free fortress and strong liquidity on a $250,000 salary, allowing you to fund college debt-free while keeping your 2030 second home on track.",
        };
      }
    }

    if (caseId === 'daniel-emily-johnson') {
      if (/life|insurance|mortality|seguro|vida|fallecimiento|cobertura/i.test(q)) {
        return {
          reply: "Your life insurance coverage ratio is currently at 45%. Adding $350,000 in term protection shields Oliver and Sophia fully and raises your health score.",
          termKey: 'mortality-ratio',
        };
      }
      if (/oliver|sophia|college|529|universidad|colegio|estudios|hijos/i.test(q)) {
        return {
          reply: "Funding college for Oliver and Sophia requires $6,200 annually, which preserves your age 62 retirement milestone without reducing living expenses.",
          termKey: '529-plan',
        };
      }
      if (/casa|home|housing|mortgage|hipoteca|denver|560/i.test(q)) {
        return {
          reply: "Your $560,000 home in Denver provides a stable housing foundation with a strong 76/100 debt management score.",
        };
      }
      if (/retir|jubil|edad|62|64|age/i.test(q)) {
        return {
          reply: "Balancing $400 a month into 529 college savings ensures you reach your target retirement age of 62 instead of delaying to 64.",
          termKey: 'withdrawal-rate',
        };
      }
    }

    // 3. Cash / Liquidity / Savings queries (English & Spanish)
    if (/cu[aá]nto.*dinero|ahorro|saldo|liquidez|efectivo|cash|savings|money|cushion|liquidity|surplus|reserva|cuanto.*tengo/i.test(q)) {
      return {
        reply: "Your household has $150,800 in total liquid cash reserves, which is 16 months of living expenses. That is $60,222 above your safety target, ready to fund debt elimination and college goals.",
      };
    }

    // 4. Score / Health Overview / General Guidance (English & Spanish)
    if (/score|puntuaci[oó]n|salud|health|resumen|overview|prioridad|priority|qu[eé] hago|qu[eé] debo hacer|consejo|recommend/i.test(q)) {
      return {
        reply: "Your financial health score is 60 out of 100, in the stable band. Your top recommended move is paying $6,800 on your 18% Chase card from cash surplus, which immediately unlocks your score from 60 to 62 and saves $1,224 a year.",
      };
    }

    // 5. General financial terms match with exact MCP numbers
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
            reply: "You currently have $0 saved in 529 accounts against a projected $113,508 college gap for Liam and Josh. Contributing $4,609 a year covers tuition without touching retirement funds.",
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
            reply: "Timothy is modeled to retire at 62 and Melanie at 60. Your safe withdrawal rate in retirement is 3.8%, well within the safe 4% threshold for a 30-year horizon.",
            termKey: item.key,
          };
        }
        return {
          reply: `Here is the explanation for ${item.key.replace('-', ' ')} based on your plan figures.`,
          termKey: item.key,
        };
      }
    }

    // 6. Contextual plan overview fallback (NEVER forces the credit card by default!)
    if (caseId === 'michael-carter') {
      return {
        reply: "Your Sherpas plan focuses on high-yield cash accumulation to reach your $550,000 home purchase in 2027. You can ask me about buying a home, retiring at 58 vs 60, or your cash flow.",
      };
    }
    if (caseId === 'samantha-lewis') {
      return {
        reply: "Your Sherpas plan coordinates college tuition with purchasing a $620,000 second home in 2030. You can ask me about college tuition, your 2030 home goal, or umbrella insurance.",
      };
    }
    if (caseId === 'daniel-emily-johnson') {
      return {
        reply: "Your Sherpas plan protects Oliver and Sophia's education while securing your age 62 retirement milestone. You can ask me about 529 college savings, life insurance coverage, or cash allocation.",
      };
    }
    return {
      reply: "Your Sherpas plan is backed by $150,800 in liquid cash reserves. Key priorities include paying down high-interest debt, adding umbrella liability, and funding college. Feel free to ask about any of these topics.",
    };
  }, [caseId]);

  // ── Text-to-speech speaker (Rock-solid with Chrome pause wake-up) ─────────────
  function speakResponse(text: string, onDone?: () => void) {
    if (!('speechSynthesis' in window)) {
      onDone?.();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch {}

    setVoiceState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Pick best available voice (English or default)
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const engVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0];
        if (engVoice) utterance.voice = engVoice;
      }
    } catch {}

    utterance.onend = () => {
      setVoiceState('idle');
      activeUtteranceRef = null;
      onDone?.();
    };
    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error', e);
      setVoiceState('idle');
      activeUtteranceRef = null;
      onDone?.();
    };

    activeUtteranceRef = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speak error', err);
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

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }

    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    transcriptBufferRef.current = '';
    hasProcessedRef.current = false;
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
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.abort();
          } catch {}
          recognitionRef.current = null;
        }

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
          if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
            micBlockedRef.current = true;
          }
        };

        recognition.onend = () => {
          if (!isListeningRef.current && !hasProcessedRef.current) {
            hasProcessedRef.current = true;
            if (stopTimeoutRef.current) {
              clearTimeout(stopTimeoutRef.current);
              stopTimeoutRef.current = null;
            }

            const captured = transcriptBufferRef.current.trim();
            if (captured) {
              processQuestion(captured);
            } else {
              setVoiceState('idle');
              setShowSuggestions(true);
              setErrorNotice(
                micBlockedRef.current
                  ? 'Microphone access blocked. Tap any question below to ask:'
                  : "Didn't catch that. Tap any question below or try again:"
              );
            }
          }
        };

        try {
          recognition.start();
        } catch (startErr: any) {
          if (startErr.name !== 'InvalidStateError') {
            console.warn('[speech start error]', startErr);
            micBlockedRef.current = true;
          }
        }

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('[speech init error]', err);
        micBlockedRef.current = true;
      }
    } else {
      micBlockedRef.current = true;
    }
  }, [voiceState, processQuestion]);

  // ── Stop Listening ──────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    isListeningRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
    }

    // Safety timeout: If recognition.onend takes more than 600ms, finalize safely
    stopTimeoutRef.current = setTimeout(() => {
      if (!hasProcessedRef.current) {
        hasProcessedRef.current = true;
        const captured = transcriptBufferRef.current.trim();
        if (captured) {
          processQuestion(captured);
        } else {
          setVoiceState('idle');
          setShowSuggestions(true);
          setErrorNotice(
            micBlockedRef.current
              ? 'Microphone access blocked. Tap any question below to ask:'
              : "Didn't catch that. Tap any question below or try again:"
          );
        }
      }
    }, 600);
  }, [processQuestion]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
    activeUtteranceRef = null;
  }, []);

  const pushToAsk = useCallback(
    (question: string) => {
      processQuestion(question);
    },
    [processQuestion]
  );

  const disconnect = useCallback(() => {
    isListeningRef.current = false;
    hasProcessedRef.current = true;
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('idle');
    activeUtteranceRef = null;
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
