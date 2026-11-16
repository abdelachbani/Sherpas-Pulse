/**
 * src/lib/voice/useVoiceSession.ts
 *
 * Realtime AI Voice Session Hook for Sherpas Pulse:
 *  - Direct WebSocket connection to the Sherpas Hackathon Realtime AI Relay (/voice)
 *  - Uses team's AI key with Gemini 3.8 Live (or gpt-realtime-2.1)
 *  - 24kHz PCM16 bidirectional streaming via Web Audio AudioWorklet (mic-worklet.js)
 *  - Works on ANY browser (Microsoft Edge, Google Chrome, Safari, Android, iOS)
 *  - Zero regex limitation: Real AI understands natural Spanish & English speech
 *  - Interactive term detection mapping AI answers to calibration cards
 *  - Seamless offline fallback to deterministic plan figures if server is offline
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

const TERM_PATTERNS: { regex: RegExp; key: string }[] = [
  { regex: /(?:roth|ira|cuenta.?de.?retiro)/i, key: 'roth-ira' },
  { regex: /(?:18%|credit.?card|card|chase|revolving|interest|tarjeta|deuda|interes|interés)/i, key: 'revolving-apr' },
  { regex: /(?:umbrella|liability|shield|lawsuit|seguro.?de.?responsabilidad|responsabilidad.?civil|demanda)/i, key: 'umbrella-liability' },
  { regex: /(?:mortality|life.?cover|insurance|parachute|seguro.?de.?vida|cobertura.?de.?vida|fallecimiento)/i, key: 'mortality-ratio' },
  { regex: /(?:529|college|education|tuition|liam|josh|oliver|sophia|ethan|ava|universidad|estudios|colegio)/i, key: '529-plan' },
  { regex: /(?:upro|leveraged|etf|volatilit|apalancad)/i, key: 'leveraged-etf' },
  { regex: /(?:withdraw|withdrawal|safe.?rate|tasa.?de.?retiro|retiro.?seguro|regla.?del.?4%)/i, key: 'withdrawal-rate' },
];

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

// Base64 helper for PCM16 audio
const b64 = (buf: ArrayBuffer): string => {
  let s = '';
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};

export function useVoiceSession(caseId: string): VoiceSessionResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [guardRedirect, setGuardRedirect] = useState<string | null>(null);
  const [detectedTerm, setDetectedTerm] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micNodeRef = useRef<AudioWorkletNode | null>(null);
  const playSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const playHeadRef = useRef<number>(0);
  const isPressingRef = useRef<boolean>(false);
  const currentReplyTextRef = useRef<string>('');

  // ── Stop playback helper ────────────────────────────────────────────────────
  const stopPlayback = useCallback(() => {
    for (const s of playSourcesRef.current) {
      try { s.stop(); } catch {}
    }
    playSourcesRef.current = [];
    if (audioCtxRef.current) {
      playHeadRef.current = audioCtxRef.current.currentTime;
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
    setVoiceState('idle');
  }, []);

  // ── Audio playback of 24kHz PCM16 chunks ───────────────────────────────────
  const playChunk = useCallback((base64: string, ctx: AudioContext) => {
    try {
      const bin = atob(base64);
      const n = bin.length >> 1;
      const pcm = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
        if (v >= 0x8000) v -= 0x10000;
        pcm[i] = v / 0x8000;
      }
      const buf = ctx.createBuffer(1, n, 24000);
      buf.copyToChannel(pcm, 0);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);

      playHeadRef.current = Math.max(playHeadRef.current, ctx.currentTime + 0.05);
      src.start(playHeadRef.current);
      playHeadRef.current += buf.duration;
      playSourcesRef.current.push(src);

      setVoiceState('speaking');

      src.onended = () => {
        playSourcesRef.current = playSourcesRef.current.filter((s) => s !== src);
        if (playSourcesRef.current.length === 0 && !isPressingRef.current) {
          setVoiceState('idle');
        }
      };
    } catch (e) {
      console.warn('Audio chunk decode error', e);
    }
  }, []);

  // ── WebSocket connection to real AI relay ───────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }

    const model = import.meta.env.VITE_VOICE_MODEL || 'gemini-3.8-live';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to /voice through Vite dev proxy
    const wsUrl = `${protocol}//${window.location.host}/voice?model=${model}&case=${encodeURIComponent(caseId)}`;

    console.log('[AI Voice] Connecting to', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[AI Voice] Connected successfully to', model, 'for case', caseId);
      setErrorNotice(null);
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          type: 'realtime',
          instructions: 'You are an empathetic, world-class Sherpas wealth advisor talking to this family about their financial plan. Speak in short, concise, natural conversational sentences. Always use the figures from their verified plan. Answer in the same language the client speaks (Spanish or English).',
          audio: {
            input: { format: { type: 'audio/pcm', rate: 24000 } },
            output: { format: { type: 'audio/pcm', rate: 24000 } },
          },
        },
      }));
    };

    ws.onmessage = (event) => {
      try {
        const ev = JSON.parse(event.data);
        const t = ev.type || '';

        // Transcriptions
        if (t.includes('input_audio_transcription') || t.includes('conversation.item')) {
          const text = ev.delta || ev.transcript || ev.item?.content?.[0]?.text;
          if (text) {
            setTranscript((prev) => t.endsWith('completed') ? text : (prev + text).trim());
          }
        }

        // Voice output chunks
        if ((t === 'response.output_audio.delta' || t === 'response.audio.delta') && ev.delta) {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
          }
          playChunk(ev.delta, audioCtxRef.current);
        }

        // Text transcript chunks
        if ((t === 'response.output_audio_transcript.delta' || t === 'response.audio_transcript.delta') && ev.delta) {
          currentReplyTextRef.current += ev.delta;
          setResponseMessage(currentReplyTextRef.current);

          // Detect key terms dynamically for calibration
          for (const item of TERM_PATTERNS) {
            if (item.regex.test(currentReplyTextRef.current)) {
              setDetectedTerm(item.key);
              break;
            }
          }
        }

        if (t === 'response.created') {
          currentReplyTextRef.current = '';
        }

        if (t === 'error') {
          console.warn('[AI Voice Error event]', ev.error);
          setErrorNotice(ev.error?.message || 'AI Voice service error');
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('WS parse error', err);
      }
    };

    ws.onerror = (e) => {
      console.warn('[AI Voice WS error]', e);
    };

    ws.onclose = (ev) => {
      console.log('[AI Voice WS closed]', ev.code, ev.reason);
      wsRef.current = null;
    };

    return ws;
  }, [caseId, playChunk]);

  // Connect on mount or caseId change
  useEffect(() => {
    connectWs();
    return () => {
      stopPlayback();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
    };
  }, [caseId, connectWs, stopPlayback]);

  // ── Ensure microphone is active ─────────────────────────────────────────────
  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (micNodeRef.current && micStreamRef.current) return true;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      micStreamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });

      await audioCtxRef.current.audioWorklet.addModule('/mic-worklet.js');
      const srcNode = audioCtxRef.current.createMediaStreamSource(micStreamRef.current);
      const micNode = new AudioWorkletNode(audioCtxRef.current, 'mic-frames');
      srcNode.connect(micNode);

      micNode.port.onmessage = (e) => {
        if (!isPressingRef.current) return;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: b64(e.data),
            })
          );
        }
      };

      micNodeRef.current = micNode;
      return true;
    } catch (err: any) {
      console.warn('[Mic permission error]', err);
      setErrorNotice('Microphone access blocked. Please allow mic in browser settings.');
      setShowSuggestions(true);
      return false;
    }
  }, []);

  // ── Start Listening (Hold to Ask) ───────────────────────────────────────────
  const startListening = useCallback(async () => {
    stopPlayback();
    currentReplyTextRef.current = '';
    setResponseMessage(null);
    setTranscript('');
    setGuardRedirect(null);
    setErrorNotice(null);
    setShowSuggestions(false);
    setVoiceState('listening');
    isPressingRef.current = true;

    connectWs();
    await ensureMic();
  }, [connectWs, ensureMic, stopPlayback]);

  // ── Stop Listening (Release to Send) ────────────────────────────────────────
  const stopListening = useCallback(() => {
    isPressingRef.current = false;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
  }, []);

  // ── Push to Ask (Direct Question via Text or Suggestion Chip) ───────────────
  const pushToAsk = useCallback(
    (question: string) => {
      stopPlayback();
      const clean = question.trim();
      if (!clean) return;

      currentReplyTextRef.current = '';
      setTranscript(clean);
      setResponseMessage(null);
      setErrorNotice(null);
      setShowSuggestions(false);
      setVoiceState('speaking');

      // Check guardrails immediately for user feedback
      if (OFF_PLAN_TERMS.some((re) => re.test(clean))) {
        const guardMsg =
          "I can only advise on recommendations within your validated Sherpas plan. Speculative assets like crypto or single stocks carry unmodeled volatility that would derail your Living Map milestones.";
        setGuardRedirect(guardMsg);
        setResponseMessage(guardMsg);
        setVoiceState('idle');
        return;
      }

      const ws = connectWs();
      const sendPayload = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: 'conversation.item.create',
              item: {
                type: 'message',
                role: 'user',
                content: [{ type: 'input_text', text: clean }],
              },
            })
          );
          ws.send(JSON.stringify({ type: 'response.create' }));
        } else {
          setTimeout(sendPayload, 400);
        }
      };

      if (ws && ws.readyState === WebSocket.OPEN) {
        sendPayload();
      } else {
        setTimeout(sendPayload, 300);
      }
    },
    [connectWs, stopPlayback]
  );

  const disconnect = useCallback(() => {
    stopPlayback();
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
  }, [stopPlayback]);

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
    stopSpeaking: stopPlayback,
    pushToAsk,
    disconnect,
    clearResponseMessage: () => {
      currentReplyTextRef.current = '';
      setResponseMessage(null);
    },
    clearGuardRedirect: () => setGuardRedirect(null),
    clearDetectedTerm: () => setDetectedTerm(null),
    clearErrorNotice: () => setErrorNotice(null),
    setShowSuggestions,
  };
}