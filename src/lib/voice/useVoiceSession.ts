/**
 * src/lib/voice/useVoiceSession.ts
 *
 * React hook for Sherpas Pulse voice integration.
 * Adapts the WebSocket + AudioWorklet pattern from examples/voice/public/index.html
 * into a typed React hook with guardrail checking.
 *
 * Session state machine:
 *   idle → connecting → connected → listening → speaking → connected
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceState = 'idle' | 'connecting' | 'connected' | 'listening' | 'speaking';

export interface VoiceSessionResult {
  voiceState: VoiceState;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  guardRedirect: string | null;
  startListening: () => void;
  stopListening: () => void;
  pushToAsk: (question: string) => void;
  disconnect: () => void;
  clearGuardRedirect: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VOICE_MODEL = import.meta.env.VITE_VOICE_MODEL ?? 'gpt-realtime-2.1-mini';
const SAMPLE_RATE = 24000;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isOpenAI(model: string) {
  return model.startsWith('gpt-');
}

/** base64-encode an ArrayBuffer without exceeding the call-stack limit */
function toBase64(buf: ArrayBuffer): string {
  let s = '';
  const u = new Uint8Array(buf);
  for (let i = 0; i < u.length; i += 0x8000) {
    s += String.fromCharCode(...u.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

/** PCM16 base64 → Float32 → AudioBuffer → schedule playback */
function schedulePcm(
  ctx: AudioContext,
  base64: string,
  playHeadRef: React.MutableRefObject<number>,
  playingRef: React.MutableRefObject<AudioBufferSourceNode[]>
): { startAt: number; seconds: number } {
  const bin = atob(base64);
  const n = bin.length >> 1;
  const pcm = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8);
    if (v >= 0x8000) v -= 0x10000;
    pcm[i] = v / 0x8000;
  }
  const buf = ctx.createBuffer(1, n, SAMPLE_RATE);
  buf.copyToChannel(pcm, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  playHeadRef.current = Math.max(playHeadRef.current, ctx.currentTime + 0.05);
  const startAt = playHeadRef.current;
  src.start(startAt);
  playHeadRef.current += buf.duration;
  playingRef.current.push(src);
  src.onended = () => {
    playingRef.current = playingRef.current.filter((s) => s !== src);
  };
  return { startAt, seconds: buf.duration };
}

function stopAllPlayback(
  ctx: AudioContext | null,
  playHeadRef: React.MutableRefObject<number>,
  playingRef: React.MutableRefObject<AudioBufferSourceNode[]>
) {
  for (const s of playingRef.current) {
    try { s.stop(); } catch { /* already stopped */ }
  }
  playingRef.current = [];
  playHeadRef.current = ctx?.currentTime ?? 0;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceSession(caseId: string): VoiceSessionResult {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [guardRedirect, setGuardRedirect] = useState<string | null>(null);

  // Refs — stable across renders, never trigger re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micNodeRef = useRef<AudioWorkletNode | null>(null);
  const playHeadRef = useRef<number>(0);
  const playingRef = useRef<AudioBufferSourceNode[]>([]);
  const pttActiveRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      _cleanup();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Guardrail check ─────────────────────────────────────────────────────────
  async function guardCheck(message: string): Promise<boolean> {
    try {
      const res = await fetch('/api/guard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, caseId }),
      });
      const data = await res.json() as { allowed: boolean; redirectMessage?: string };
      if (!data.allowed) {
        setGuardRedirect(data.redirectMessage ?? 'Off-topic question blocked.');
        return false;
      }
    } catch {
      // Network failure — allow (fail open so demos work without server)
    }
    return true;
  }

  // ── Session update (sent on connect) ───────────────────────────────────────
  function buildSessionUpdate() {
    return {
      type: 'session.update',
      session: {
        type: 'realtime',
        instructions:
          'You are a friendly Sherpas financial guide. Help the household understand their plan. ' +
          'Speak in short, natural sentences. If they interrupt, stop and answer what they asked.',
        audio: {
          input: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
          output: { format: { type: 'audio/pcm', rate: SAMPLE_RATE } },
          ...(isOpenAI(VOICE_MODEL)
            ? {
                input: {
                  format: { type: 'audio/pcm', rate: SAMPLE_RATE },
                  transcription: { model: 'gpt-4o-mini-transcribe' },
                },
                output: {
                  format: { type: 'audio/pcm', rate: SAMPLE_RATE },
                  voice: 'marin',
                },
              }
            : {}),
        },
        turn_detection: { type: 'server_vad', silence_duration_ms: 500 },
      },
    };
  }

  // ── WebSocket event handling ────────────────────────────────────────────────
  function onEvent(ev: Record<string, unknown>) {
    if (!isMountedRef.current) return;
    const t = ev['type'] as string;

    if (t === 'session.created' || t === 'session.updated') {
      setVoiceState('connected');
    }

    if (t === 'input_audio_buffer.speech_started') {
      stopAllPlayback(ctxRef.current, playHeadRef, playingRef);
    }

    if (t === 'response.created') {
      setVoiceState('speaking');
    }

    if (
      (t === 'response.output_audio.delta' || t === 'response.audio.delta') &&
      ev['delta'] &&
      ctxRef.current
    ) {
      schedulePcm(ctxRef.current, ev['delta'] as string, playHeadRef, playingRef);
    }

    if (
      t === 'response.output_audio_transcript.delta' ||
      t === 'response.audio_transcript.delta'
    ) {
      setTranscript((prev) => prev + ((ev['delta'] as string) ?? ''));
    }

    if (t === 'response.done' || t === 'response.output_audio.done') {
      if (voiceState === 'speaking') setVoiceState('connected');
    }

    if (t === 'error') {
      console.error('[voice] error', ev['error']);
      setVoiceState('idle');
    }
  }

  // ── Connect + mic setup ────────────────────────────────────────────────────
  const startListening = useCallback(async () => {
    if (wsRef.current || voiceState !== 'idle') return;
    setVoiceState('connecting');
    setTranscript('');

    // 1. Mic + AudioContext
    try {
      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      ctxRef.current = ctx;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      streamRef.current = stream;
      await ctx.audioWorklet.addModule('/mic-worklet.js');
      const srcNode = ctx.createMediaStreamSource(stream);
      const micNode = new AudioWorkletNode(ctx, 'mic-frames');
      srcNode.connect(micNode);
      micNodeRef.current = micNode;

      // Forward mic frames to WebSocket
      micNode.port.onmessage = (e: MessageEvent) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        if (!pttActiveRef.current) return; // PTT: only send while button held
        wsRef.current.send(
          JSON.stringify({ type: 'input_audio_buffer.append', audio: toBase64(e.data as ArrayBuffer) })
        );
      };
    } catch (err) {
      console.error('[voice] mic error', err);
      setVoiceState('idle');
      return;
    }

    // 2. WebSocket
    const q = new URLSearchParams({ model: VOICE_MODEL, case: caseId });
    const wsUrl = `${location.origin.replace(/^http/, 'ws')}/voice?${q}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    pttActiveRef.current = true; // start sending immediately

    ws.onopen = () => {
      ws.send(JSON.stringify(buildSessionUpdate()));
    };

    ws.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data) as Record<string, unknown>);
      } catch {
        // ignore malformed
      }
    };

    ws.onclose = () => {
      if (isMountedRef.current) setVoiceState('idle');
      _cleanup();
    };

    ws.onerror = () => {
      if (isMountedRef.current) setVoiceState('idle');
    };

    setVoiceState('listening');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, voiceState]);

  // ── Stop listening (PTT release) ───────────────────────────────────────────
  const stopListening = useCallback(() => {
    pttActiveRef.current = false;
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      wsRef.current.send(JSON.stringify({ type: 'response.create' }));
    }
    if (voiceState === 'listening') setVoiceState('connected');
  }, [voiceState]);

  // ── pushToAsk: text → voice ────────────────────────────────────────────────
  const pushToAsk = useCallback(
    async (question: string) => {
      const allowed = await guardCheck(question);
      if (!allowed) return;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'conversation.item.create',
            item: {
              type: 'message',
              role: 'user',
              content: [{ type: 'input_text', text: question }],
            },
          })
        );
        wsRef.current.send(JSON.stringify({ type: 'response.create' }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [caseId]
  );

  // ── Disconnect ─────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    _cleanup();
    setVoiceState('idle');
  }, []);

  function _cleanup() {
    stopAllPlayback(ctxRef.current, playHeadRef, playingRef);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => {});
    ctxRef.current = null;
    wsRef.current = null;
    micNodeRef.current = null;
    pttActiveRef.current = false;
  }

  return {
    voiceState,
    isConnected: voiceState !== 'idle' && voiceState !== 'connecting',
    isListening: voiceState === 'listening',
    isSpeaking: voiceState === 'speaking',
    transcript,
    guardRedirect,
    startListening,
    stopListening,
    pushToAsk,
    disconnect,
    clearGuardRedirect: () => setGuardRedirect(null),
  };
}
