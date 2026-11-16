/**
 * src/lib/voice/index.ts
 * Voice integration wrappers — placeholder skeleton for the voice worker.
 * Connect to VITE_LLM_PROXY_URL using the OpenAI Realtime API protocol.
 */

export interface VoiceSessionConfig {
  proxyUrl: string;
  teamKey: string;
  model: string;
  systemPrompt: string;
}

export interface VoiceSession {
  sendText(text: string): void;
  close(): void;
  onTranscript: ((text: string) => void) | null;
  onStateChange: ((state: 'connecting' | 'connected' | 'disconnected') => void) | null;
}

/**
 * Creates a voice session via the Sherpas LLM proxy.
 * Implementation left for the voice worker.
 */
export function createVoiceSession(_config: VoiceSessionConfig): VoiceSession {
  // TODO: Voice worker will implement the WebSocket/WebRTC Realtime API here.
  throw new Error('Voice session not yet implemented — awaiting voice worker.');
}
