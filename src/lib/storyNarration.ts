export interface StoryNarration {
  cancel(): void;
  pause(): void;
  resume(): void;
}

type SpeechResult = 'finished' | 'blocked' | 'unavailable';

const NAVIGATION_SETTLE_MS = 120;
const START_TIMEOUT_MS = 3500;

/** Start one utterance after navigation settles and ignore events from canceled speech. */
export function startStoryNarration(
  text: string,
  onSettled: (result: SpeechResult) => void,
  startImmediately = false,
): StoryNarration | null {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return null;

  const engine = window.speechSynthesis;
  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = 'en-US';
  speech.rate = 1.05;
  const speechTimeout = Math.max(30_000, text.trim().split(/\s+/).length * 1000);
  let launchTimer = 0;
  let watchdog = 0;
  let active = true;
  let launched = false;
  let paused = false;
  let started = false;

  function settle(result?: SpeechResult, cancelSpeech = false) {
    if (!active) return;
    active = false;
    window.clearTimeout(launchTimer);
    window.clearTimeout(watchdog);
    speech.onstart = null;
    speech.onend = null;
    speech.onerror = null;
    if (cancelSpeech && launched) {
      engine.cancel();
      if (paused && engine.paused) engine.resume();
    }
    if (result) onSettled(result);
  }

  function watchSpeech() {
    window.clearTimeout(watchdog);
    if (!active || paused) return;
    watchdog = window.setTimeout(() => {
      if (!started && engine.speaking) {
        // Some engines speak without first sending the utterance's start event.
        started = true;
        watchSpeech();
      } else {
        settle('unavailable', true);
      }
    }, started ? speechTimeout : START_TIMEOUT_MS);
  }

  function launch() {
    launched = true;
    watchSpeech();
    try {
      engine.speak(speech);
    } catch {
      queueMicrotask(() => settle('unavailable', true));
    }
  }

  speech.onstart = () => {
    started = true;
    watchSpeech();
  };
  speech.onend = () => settle('finished');
  speech.onerror = (event) => settle(event.error === 'not-allowed' ? 'blocked' : 'unavailable');
  if (startImmediately) launch();
  else launchTimer = window.setTimeout(launch, NAVIGATION_SETTLE_MS);

  return {
    cancel: () => settle(undefined, true),
    pause() {
      if (!active || paused) return;
      paused = true;
      window.clearTimeout(launchTimer);
      window.clearTimeout(watchdog);
      if (launched) engine.pause();
    },
    resume() {
      if (!active || !paused) return;
      paused = false;
      if (!launched) {
        launchTimer = window.setTimeout(launch, NAVIGATION_SETTLE_MS);
        return;
      }
      engine.resume();
      watchSpeech();
    },
  };
}
