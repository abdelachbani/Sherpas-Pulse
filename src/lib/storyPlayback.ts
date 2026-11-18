import type { ViewingStyle } from '../types';

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

export function storyTapDirection(startX: number, startY: number, endX: number, endY: number, width: number): 'previous' | 'next' | null {
  if (Math.hypot(endX - startX, endY - startY) > 12 || width <= 0) return null;
  return endX < width / 2 ? 'previous' : 'next';
}

export function advanceBeat(partIndex: number, partCount: number, checkpoint: boolean) {
  if (checkpoint || partIndex >= partCount - 1) return { partIndex, checkpoint: true };
  return { partIndex: partIndex + 1, checkpoint: false };
}

const beatTiming = {
  visual: { minimum: 3000, maximum: 8000, perWord: 300 },
  analytical: { minimum: 5500, maximum: 12000, perWord: 420 },
  express: { minimum: 2700, maximum: 6500, perWord: 250 },
} satisfies Record<ViewingStyle, { minimum: number; maximum: number; perWord: number }>;

export function beatDuration(text: string, style: ViewingStyle = 'visual'): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const { minimum, maximum, perWord } = beatTiming[style];
  return Math.min(maximum, Math.max(minimum, words * perWord));
}

export function nextChapterFrame(index: number, frames: { chapterId: string }[]) {
  const next = frames.findIndex((frame, candidate) => candidate > index && frame.chapterId !== frames[index]?.chapterId);
  return next < 0 ? { index, complete: true } : { index: next, complete: false };
}

export function advanceElapsed(elapsed: number, delta: number, paused: boolean, duration: number): number {
  return Math.min(duration, Math.max(0, elapsed + (paused ? 0 : Math.max(0, delta))));
}

export function chapterProgress(durations: number[], partIndex: number, elapsed: number, checkpoint: boolean): number {
  if (checkpoint) return 1;
  const total = durations.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;
  const completed = durations.slice(0, partIndex).reduce((sum, value) => sum + value, 0);
  return Math.min(1, Math.max(0, (completed + Math.min(Math.max(0, elapsed), durations[partIndex] ?? 0)) / total));
}
