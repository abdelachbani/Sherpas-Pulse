export function previousStory(index: number) {
  return { index: Math.max(0, index - 1), complete: false };
}

export function nextStory(index: number, count: number) {
  if (count <= 0) return { index: 0, complete: false };
  const current = Math.max(0, Math.min(index, count - 1));
  return current === count - 1
    ? { index: current, complete: true }
    : { index: current + 1, complete: false };
}

export function shouldAdvancePlayback(playing: boolean, hidden: boolean, modalOpen: boolean, assistantActive: boolean) {
  return playing && !hidden && !modalOpen && !assistantActive;
}

/** Only visible voice interactions block reading and navigation. */
export function voiceBlocksPlayback(voice: {
  isListening: boolean;
  isSpeaking: boolean;
  responseMessage?: string | null;
  guardRedirect?: string | null;
}, panelOpen: boolean): boolean {
  return voice.isListening || voice.isSpeaking || Boolean(voice.responseMessage) || Boolean(voice.guardRedirect) || panelOpen;
}
