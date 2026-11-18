/**
 * src/lib/voice/useVoiceSession.ts
 *
 * Realtime AI Voice Session Hook for Sherpas Pulse:
 *  - Direct WebSocket connection to the Sherpas Realtime AI Relay (/voice)
 *  - Uses team's AI key with Gemini 3.8 Live (or gpt-realtime-2.1)
 *  - 24kHz PCM16 bidirectional streaming via Web Audio AudioWorklet (mic-worklet.js)
 *  - Persistent MediaStreamAudioSourceNode reference preventing V8 garbage collection
 *  - Live RMS audio level metering for responsive waveform visualizer in Chrome & Edge
 *  - Push-to-talk turn detection with graceful pending commit handling while connecting
 *  - Interactive term detection mapping AI answers to calibration cards
 *  - Seamless offline fallback to deterministic grounded plan figures if server is offline
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { preferNaturalVoice } from '../storyNarration';
import { useAppStore } from '../../stores/appStore';
import { createResponseGate } from './responseGate';
import { createInputQueue } from './inputQueue';
import { typedQuestionMessages } from './typedQuestion';
import {
  getOfflineAnswer,
  asksAboutAnotherHousehold,
  OFF_PLAN_TERMS,
} from './offlineAnswer';

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
  audioLevel: number;
  setAudioMuted: (muted: boolean) => void;
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

// Base64 helper for PCM16 audio
const b64 = (buf: ArrayBuffer): string => {
  let s = '';
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  return btoa(s);
};

export function useVoiceSession(caseId: string): VoiceSessionResult {
  const trackVoiceAsk = useAppStore((state) => state.trackVoiceAsk);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [transcript, setTranscript] = useState('');
  const transcriptRef = useRef('');
  transcriptRef.current = transcript;
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [guardRedirect, setGuardRedirect] = useState<string | null>(null);
  const [detectedTerm, setDetectedTerm] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micNodeRef = useRef<AudioWorkletNode | null>(null);
  const playSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const audioMutedRef = useRef(false);
  const fallbackSpeechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const playHeadRef = useRef<number>(0);
  const isPressingRef = useRef<boolean>(false);
  const currentReplyTextRef = useRef<string>('');
  const voiceAskRecordedRef = useRef(false);
  const responseGateRef = useRef(createResponseGate());
  const reopenAfterItemRef = useRef(false);
  const waitingSendRef = useRef<(() => void) | null>(null);
  const waitingTimerRef = useRef<number | null>(null);

  // Audio capture & pending commit tracking
  const audioFramesCountRef = useRef<number>(0);
  const pendingAudioRef = useRef(createInputQueue());
  const pendingCommitRef = useRef<{ token: number; hasAudio: boolean } | null>(null);
  const lastLevelUpdateRef = useRef<number>(0);

  // Fallback and response tracking refs
  const activeRequestTokenRef = useRef<number | null>(null);
  const inFlightQuestionRef = useRef<string | null>(null);
  const responseTimeoutTimerRef = useRef<number | null>(null);

  const clearWaitingSend = useCallback(() => {
    waitingSendRef.current = null;
    if (waitingTimerRef.current !== null) window.clearTimeout(waitingTimerRef.current);
    waitingTimerRef.current = null;
  }, []);

  const sendAfterCancel = useCallback((send: () => void) => {
    if (!responseGateRef.current.isBlocked()) { send(); return; }
    clearWaitingSend();
    waitingSendRef.current = send;
    waitingTimerRef.current = window.setTimeout(() => {
      clearWaitingSend();
      responseGateRef.current.failWaiting();
      const socket = wsRef.current;
      wsRef.current = null;
      responseGateRef.current = createResponseGate();
      socket?.close();
      setIsConnected(false);
      setVoiceState('idle');
      setErrorNotice('The previous response was interrupted. Please ask again.');
    }, 5000);
  }, [clearWaitingSend]);

  // ── Offline Grounded Fallback Answer ────────────────────────────────────────
  const executeFallback = useCallback(
    (question: string, reason?: string) => {
      if (responseTimeoutTimerRef.current !== null) {
        window.clearTimeout(responseTimeoutTimerRef.current);
        responseTimeoutTimerRef.current = null;
      }
      const token = activeRequestTokenRef.current;
      if (token !== null && !responseGateRef.current.isCurrent(token)) return;
      pendingCommitRef.current = null;
      pendingAudioRef.current.clear();
      if (responseGateRef.current.cancel() && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
      }
      inFlightQuestionRef.current = null;
      const fallback = getOfflineAnswer(caseId, question);

      if (fallback.isGuardrail) {
        setGuardRedirect(fallback.text);
        setResponseMessage(fallback.text);
        setVoiceState('idle');
        return;
      }

      setResponseMessage(fallback.text);
      if (fallback.detectedTerm) {
        setDetectedTerm(fallback.detectedTerm);
      }
      setErrorNotice(reason || 'AI relay offline · Answered from verified plan figures');
      setShowSuggestions(true);

      // Attempt speech synthesis for spoken voice feedback
      if (!audioMutedRef.current && 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance !== 'undefined') {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(fallback.text);
          preferNaturalVoice(utterance);
          fallbackSpeechRef.current = utterance;
          const finish = () => {
            if (fallbackSpeechRef.current !== utterance) return;
            fallbackSpeechRef.current = null;
            setVoiceState('idle');
          };
          utterance.onend = finish;
          utterance.onerror = finish;
          setVoiceState('speaking');
          window.speechSynthesis.speak(utterance);
        } catch {
          fallbackSpeechRef.current = null;
          setVoiceState('idle');
        }
      } else {
        setVoiceState('idle');
      }
    },
    [caseId]
  );

  // ── Safety timeout helper ───────────────────────────────────────────────────
  const startResponseTimeout = useCallback(
    (token: number, reason: string) => {
      if (responseTimeoutTimerRef.current !== null) {
        window.clearTimeout(responseTimeoutTimerRef.current);
      }
      responseTimeoutTimerRef.current = window.setTimeout(() => {
        responseTimeoutTimerRef.current = null;
        if (responseGateRef.current.isCurrent(token) && !currentReplyTextRef.current) {
          if (inFlightQuestionRef.current || transcriptRef.current) {
            executeFallback(inFlightQuestionRef.current || transcriptRef.current, reason);
          } else {
            setVoiceState('idle');
            setErrorNotice('Voice transcription unavailable. Please type your question.');
            setShowSuggestions(true);
          }
          pendingCommitRef.current = null;
          pendingAudioRef.current.clear();
          if (responseGateRef.current.cancel() && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
          }
        }
      }, 8000);
    },
    [executeFallback]
  );

  // ── Stop playback helper ────────────────────────────────────────────────────
  const setAudioMuted = useCallback((muted: boolean) => {
    audioMutedRef.current = muted;
    if (!muted) return;
    for (const source of playSourcesRef.current) {
      try { source.stop(); } catch { /* The source may have already stopped. */ }
    }
    if (audioCtxRef.current) playHeadRef.current = audioCtxRef.current.currentTime;
    if (fallbackSpeechRef.current) {
      fallbackSpeechRef.current = null;
      window.speechSynthesis.cancel();
      setVoiceState('idle');
    }
  }, []);

  const stopPlayback = useCallback(() => {
    clearWaitingSend();
    if (reopenAfterItemRef.current) {
      // If the proxy never closed the response, a new turn can stall on that connection.
      reopenAfterItemRef.current = false;
      const finishedSocket = wsRef.current;
      wsRef.current = null;
      responseGateRef.current = createResponseGate();
      finishedSocket?.close();
      setIsConnected(false);
    }
    const discardInput = isPressingRef.current || pendingCommitRef.current?.hasAudio;
    isPressingRef.current = false;
    audioFramesCountRef.current = 0;
    pendingAudioRef.current.clear();
    if (responseTimeoutTimerRef.current !== null) {
      window.clearTimeout(responseTimeoutTimerRef.current);
      responseTimeoutTimerRef.current = null;
    }
    inFlightQuestionRef.current = null;
    pendingCommitRef.current = null;
    setAudioLevel(0);

    if (discardInput && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.clear' }));
    }

    const shouldCancel = responseGateRef.current.cancel();
    if (shouldCancel && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'response.cancel' }));
    }
    for (const s of playSourcesRef.current) {
      try { s.stop(); } catch { /* Audio or socket may already be stopped */ }
    }
    playSourcesRef.current = [];
    if (audioCtxRef.current) {
      playHeadRef.current = audioCtxRef.current.currentTime;
    }
    if (fallbackSpeechRef.current && 'speechSynthesis' in window) {
      fallbackSpeechRef.current = null;
      try { window.speechSynthesis.cancel(); } catch { /* Speech synthesis cleanup */ }
    }
    setVoiceState('idle');
  }, [clearWaitingSend]);

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

      const generation = responseGateRef.current.current();
      src.onended = () => {
        playSourcesRef.current = playSourcesRef.current.filter((s) => s !== src);
        if (playSourcesRef.current.length === 0 && !isPressingRef.current && generation === responseGateRef.current.current()) {
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
    // Connect to /voice through dev server / proxy
    const wsUrl = `${protocol}//${window.location.host}/voice?model=${model}&case=${encodeURIComponent(caseId)}`;

    console.log('[AI Voice] Connecting to', wsUrl);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current !== ws) return;
      console.log('[AI Voice] Connected successfully to', model, 'for case', caseId);
      setIsConnected(true);
      setErrorNotice(null);
      ws.send(JSON.stringify({
        type: 'session.update',
        session: {
          type: 'realtime',
          audio: {
            input: {
              format: { type: 'audio/pcm', rate: 24000 },
              turn_detection: null, // Push-to-talk: explicit commit
              transcription: { model: 'gpt-4o-mini-transcribe' },
            },
            output: {
              format: { type: 'audio/pcm', rate: 24000 },
              voice: 'marin',
            },
          },
        },
      }));

      pendingAudioRef.current.flush((message) => ws.send(JSON.stringify(message)));

      // Flush pending commit if stopListening was called while connecting
      if (pendingCommitRef.current) {
        const { token, hasAudio } = pendingCommitRef.current;
        pendingCommitRef.current = null;
        if (responseGateRef.current.isCurrent(token)) {
          if (hasAudio) {
            ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
            if (responseGateRef.current.markSent(token)) {
              ws.send(JSON.stringify({ type: 'response.create' }));
            }
            setVoiceState('speaking');
            startResponseTimeout(token, 'Voice relay response timed out · Answered from verified plan figures');
          } else {
            setVoiceState('idle');
          }
        }
      }
    };

    function finishResponse(responseId?: string) {
      const gate = responseGateRef.current;
      const wasBlocked = gate.isBlocked();
      if (gate.finish(responseId)) {
        if (responseTimeoutTimerRef.current !== null) window.clearTimeout(responseTimeoutTimerRef.current);
        responseTimeoutTimerRef.current = null;
        inFlightQuestionRef.current = null;
        if (playSourcesRef.current.length === 0 && !isPressingRef.current) setVoiceState('idle');
      }
      if (wasBlocked && !gate.isBlocked()) {
        const queued = waitingSendRef.current;
        clearWaitingSend();
        queued?.();
      }
    }

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;
      try {
        const ev = JSON.parse(event.data);
        const t = ev.type || '';
        const responseId = ev.response_id ?? ev.response?.id;

        if (t === 'response.created') {
          if (!responseGateRef.current.created(responseId)) return;
          currentReplyTextRef.current = '';
          if (responseTimeoutTimerRef.current !== null) {
            window.clearTimeout(responseTimeoutTimerRef.current);
            responseTimeoutTimerRef.current = null;
          }
          return;
        }

        if (t.startsWith('response.') && t !== 'response.done' && !responseGateRef.current.accepts(responseId)) return;

        if (t === 'response.done') {
          reopenAfterItemRef.current = false;
          finishResponse(responseId);
          return;
        }

        // Some upstream sessions close the assistant message before sending the final response event.
        if (t === 'response.output_item.done' && currentReplyTextRef.current) {
          reopenAfterItemRef.current = true;
          finishResponse(responseId);
          return;
        }

        // Transcriptions
        if (t.includes('input_audio_transcription') || t.includes('conversation.item')) {
          const text = ev.delta || ev.transcript || ev.item?.content?.[0]?.text;
          if (text) {
            setTranscript((prev) => t.endsWith('completed') ? text : (prev + text).trim());
            if (
              t.includes('input_audio_transcription')
              && t.endsWith('completed')
              && !voiceAskRecordedRef.current
            ) {
              trackVoiceAsk({ inputMode: 'voice' });
              voiceAskRecordedRef.current = true;
            }
          }
        }

        // Voice output chunks
        if ((t === 'response.output_audio.delta' || t === 'response.audio.delta') && ev.delta && !audioMutedRef.current) {
          if (!audioCtxRef.current) {
            try {
              audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
            } catch {
              audioCtxRef.current = new AudioContext();
            }
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          playChunk(ev.delta, audioCtxRef.current);
        }

        // Text transcript chunks
        if ((t === 'response.output_audio_transcript.delta' || t === 'response.audio_transcript.delta' || t === 'response.output_text.delta' || t === 'response.text.delta') && ev.delta) {
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

        if (t === 'error') {
          console.warn('[AI Voice Error event]', ev.error);
          setIsConnected(false);
          const errorMsg = ev.error?.message || 'AI Voice service error';
          setErrorNotice(errorMsg);
          setShowSuggestions(true);
          if (inFlightQuestionRef.current && !currentReplyTextRef.current) {
            const q = inFlightQuestionRef.current;
            executeFallback(q, errorMsg.includes('TEAM_KEY') ? 'Server missing TEAM_KEY · Answering from verified plan' : errorMsg);
          } else {
            setVoiceState('idle');
          }
        }
      } catch (err) {
        console.warn('WS parse error', err);
      }
    };

    ws.onerror = (e) => {
      if (wsRef.current !== ws) return;
      console.warn('[AI Voice WS error]', e);
      setIsConnected(false);
      if (pendingCommitRef.current) {
        pendingCommitRef.current = null;
        setVoiceState('idle');
        setErrorNotice('Voice relay unavailable. Please type your question.');
        setShowSuggestions(true);
      } else if (inFlightQuestionRef.current && !currentReplyTextRef.current) {
        const q = inFlightQuestionRef.current;
        executeFallback(q, 'Voice relay unavailable · Answered from verified plan figures');
      }
    };

    ws.onclose = (ev) => {
      if (wsRef.current !== ws) return;
      console.log('[AI Voice WS closed]', ev.code, ev.reason);
      setIsConnected(false);
      wsRef.current = null;
      reopenAfterItemRef.current = false;
      if (responseGateRef.current.isBlocked()) responseGateRef.current = createResponseGate();
      if (pendingCommitRef.current) {
        pendingCommitRef.current = null;
        setVoiceState('idle');
        setErrorNotice('Voice relay offline. Please type your question.');
        setShowSuggestions(true);
      } else if (inFlightQuestionRef.current && !currentReplyTextRef.current) {
        const q = inFlightQuestionRef.current;
        executeFallback(q, 'Voice relay offline · Answered from verified plan figures');
      }
    };

    return ws;
  }, [caseId, clearWaitingSend, executeFallback, playChunk, startResponseTimeout, trackVoiceAsk]);

  // Connect on mount or caseId change
  useEffect(() => {
    connectWs();
    return () => {
      stopPlayback();
      if (wsRef.current) {
        try { wsRef.current.close(); } catch { /* Cleanup */ }
        wsRef.current = null;
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
        micStreamRef.current = null;
      }
      sourceNodeRef.current = null;
      micNodeRef.current = null;
    };
  }, [caseId, connectWs, stopPlayback]);

  // ── Ensure microphone is active ─────────────────────────────────────────────
  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (micNodeRef.current && micStreamRef.current && sourceNodeRef.current) return true;
    try {
      if (!audioCtxRef.current) {
        try {
          audioCtxRef.current = new AudioContext({ sampleRate: 24000 });
        } catch {
          audioCtxRef.current = new AudioContext();
        }
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
      micStreamRef.current = stream;

      await audioCtxRef.current.audioWorklet.addModule('/mic-worklet.js');
      const srcNode = audioCtxRef.current.createMediaStreamSource(stream);
      // Persist in ref so V8 GC does not collect the source node
      sourceNodeRef.current = srcNode;

      const micNode = new AudioWorkletNode(audioCtxRef.current, 'mic-frames');
      srcNode.connect(micNode);
      // The processor has no audible output; connecting it keeps the graph rendering.
      micNode.connect(audioCtxRef.current.destination);

      micNode.port.onmessage = (e) => {
        // Compute live RMS amplitude for visual level meters & soundwaves
        const frame = new Int16Array(e.data);
        let sum = 0;
        for (let i = 0; i < frame.length; i++) {
          sum += frame[i] * frame[i];
        }
        const rms = Math.sqrt(sum / frame.length) / 32768;
        const normalizedLevel = Math.min(1, rms * 8);

        const now = performance.now();
        if (now - lastLevelUpdateRef.current > 50) {
          lastLevelUpdateRef.current = now;
          setAudioLevel(normalizedLevel);
        }

        if (!isPressingRef.current) return;
        audioFramesCountRef.current++;

        const audio = b64(e.data);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.append', audio }));
        } else if (wsRef.current?.readyState === WebSocket.CONNECTING) {
          pendingAudioRef.current.append(audio);
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
    pendingCommitRef.current = null;
    audioFramesCountRef.current = 0;
    pendingAudioRef.current.clear();
    const token = responseGateRef.current.start();
    activeRequestTokenRef.current = token;
    voiceAskRecordedRef.current = false;
    currentReplyTextRef.current = '';
    setResponseMessage(null);
    setDetectedTerm(null);
    transcriptRef.current = '';
    setTranscript('');
    setGuardRedirect(null);
    setErrorNotice(null);
    setShowSuggestions(false);
    setAudioLevel(0);
    setVoiceState('listening');
    isPressingRef.current = true;

    connectWs();
    if (!await ensureMic() && responseGateRef.current.isCurrent(token)) {
      isPressingRef.current = false;
      setVoiceState('idle');
    }
  }, [connectWs, ensureMic, stopPlayback]);

  // ── Stop Listening (Release to Send) ────────────────────────────────────────
  const stopListening = useCallback(() => {
    if (!isPressingRef.current) return;
    isPressingRef.current = false;
    setAudioLevel(0);

    const token = responseGateRef.current.current();
    const hasAudio = audioFramesCountRef.current > 0;

    sendAfterCancel(() => {
      if (!responseGateRef.current.isCurrent(token)) return;

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        if (hasAudio) {
          ws.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
          if (responseGateRef.current.markSent(token)) {
            ws.send(JSON.stringify({ type: 'response.create' }));
          }
          setVoiceState('speaking');
          startResponseTimeout(token, 'Voice relay response timed out · Answered from verified plan figures');
        } else {
          // No audio was captured (quick release or silent mic)
          setVoiceState('idle');
        }
      } else if (ws && ws.readyState === WebSocket.CONNECTING) {
        // WebSocket is still handshaking — queue commit for onopen without false "offline" abort
        pendingCommitRef.current = { token, hasAudio };
        if (hasAudio) {
          setVoiceState('speaking');
          startResponseTimeout(token, 'Voice relay connection timed out · Answered from verified plan figures');
        } else {
          setVoiceState('idle');
        }
      } else {
        // Socket is closed or unavailable — provide immediate graceful fallback if audio was spoken
        if (hasAudio) {
          setVoiceState('idle');
          setErrorNotice('Voice relay offline. Please type your question.');
          setShowSuggestions(true);
        } else {
          setVoiceState('idle');
          setShowSuggestions(true);
        }
      }
    });
  }, [sendAfterCancel, startResponseTimeout]);

  // ── Push to Ask (Direct Question via Text or Suggestion Chip) ───────────────
  const pushToAsk = useCallback(
    (question: string) => {
      stopPlayback();
      const clean = question.trim();
      if (!clean) return;

      const requestToken = responseGateRef.current.start();
      activeRequestTokenRef.current = requestToken;
      trackVoiceAsk({ inputMode: 'typed_or_suggestion' });

      currentReplyTextRef.current = '';
      setTranscript(clean);
      setResponseMessage(null);
      setDetectedTerm(null);
      setGuardRedirect(null);
      setErrorNotice(null);
      setShowSuggestions(false);
      setVoiceState('speaking');

      // Check guardrails immediately for user feedback
      if (asksAboutAnotherHousehold(caseId, clean) || OFF_PLAN_TERMS.some((re) => re.test(clean))) {
        const redirect = getOfflineAnswer(caseId, clean).text;
        setGuardRedirect(redirect);
        setResponseMessage(redirect);
        setVoiceState('idle');
        return;
      }

      inFlightQuestionRef.current = clean;
      connectWs();

      let attempts = 0;
      const MAX_ATTEMPTS = 5; // 5 * 250ms = 1.25s max connection attempt window
      let pollTimer: number | null = null;

      const sendPayload = () => {
        if (!responseGateRef.current.isCurrent(requestToken)) {
          if (pollTimer !== null) window.clearTimeout(pollTimer);
          return;
        }

        const activeWs = wsRef.current;

        // If WebSocket is ready, send the question and request response
        if (activeWs && activeWs.readyState === WebSocket.OPEN) {
          if (pollTimer !== null) window.clearTimeout(pollTimer);
          const messages = typedQuestionMessages(clean);
          activeWs.send(JSON.stringify(messages[0]));
          if (responseGateRef.current.markSent(requestToken)) {
            activeWs.send(JSON.stringify(messages[1]));
          }

          // Safety timeout in case server never responds
          startResponseTimeout(requestToken, 'Response timed out · Answered from verified plan figures');
          return;
        }

        // If WebSocket is closed or closing, or attempts exhausted: do not loop forever!
        attempts++;
        if (!activeWs || activeWs.readyState === WebSocket.CLOSED || activeWs.readyState === WebSocket.CLOSING || attempts >= MAX_ATTEMPTS) {
          if (pollTimer !== null) window.clearTimeout(pollTimer);
          executeFallback(clean, 'Voice relay offline · Answered from verified plan figures');
          return;
        }

        // Still connecting: retry after 250ms
        pollTimer = window.setTimeout(sendPayload, 250);
      };

      sendAfterCancel(() => {
        const activeWs = wsRef.current;
        if (activeWs && activeWs.readyState === WebSocket.OPEN) {
          sendPayload();
        } else {
          pollTimer = window.setTimeout(sendPayload, 200);
        }
      });
    },
    [caseId, connectWs, executeFallback, sendAfterCancel, startResponseTimeout, stopPlayback, trackVoiceAsk]
  );

  const disconnect = useCallback(() => {
    stopPlayback();
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { /* Socket close cleanup */ }
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [stopPlayback]);

  return {
    voiceState,
    isConnected,
    isListening: voiceState === 'listening',
    isSpeaking: voiceState === 'speaking',
    transcript,
    responseMessage,
    guardRedirect,
    detectedTerm,
    errorNotice,
    showSuggestions,
    audioLevel,
    setAudioMuted,
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
