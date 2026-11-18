import clips from './sherpiNarrationClips.json';

export interface StoryNarration {
  cancel(): void;
  pause(): void;
  resume(): void;
}

type SpeechResult = 'finished' | 'blocked' | 'unavailable';

const NAVIGATION_SETTLE_MS = 120;
const START_TIMEOUT_MS = 3500;

const clipByText: Readonly<Record<string, string>> = clips;

export function preferNaturalVoice(speech: SpeechSynthesisUtterance, language = 'en-US') {
  speech.lang = language;
  const voices = window.speechSynthesis.getVoices?.() ?? [];
  const voice = voices.find(candidate =>
    candidate.localService && candidate.lang === language && /natural|enhanced|premium/i.test(candidate.name),
  );
  if (voice) speech.voice = voice;
}

function startRecordedNarration(filename: string, onSettled: (result: SpeechResult) => void): StoryNarration {
  const audio = new Audio(`${import.meta.env.BASE_URL}sherpi-narration/${filename}`);
  let active = true;
  let watchdog = 0;
  function settle(result?: SpeechResult) {
    if (!active) return;
    active = false;
    window.clearTimeout(watchdog);
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    if (result) onSettled(result);
  }

  function play() {
    window.clearTimeout(watchdog);
    watchdog = window.setTimeout(() => settle('unavailable'), 35_000);
    audio.play().catch((error: DOMException) => {
      if (error.name !== 'AbortError') settle(error.name === 'NotAllowedError' ? 'blocked' : 'unavailable');
    });
  }

  audio.onended = () => settle('finished');
  audio.onerror = () => settle('unavailable');
  play();
  return {
    cancel: () => settle(),
    pause() {
      if (!active) return;
      window.clearTimeout(watchdog);
      audio.pause();
    },
    resume() {
      if (active) play();
    },
  };
}

/** Play Sherpi's recording when available, with browser speech for personalized lines. */
export function startStoryNarration(
  text: string,
  onSettled: (result: SpeechResult) => void,
  startImmediately = false,
): StoryNarration | null {
  const filename = clipByText[text];
  if (filename && typeof Audio !== 'undefined') {
    let playback: StoryNarration | null = startRecordedNarration(filename, result => {
      if (result === 'unavailable') playback = startNativeNarration(text, onSettled, startImmediately);
      if (result !== 'unavailable' || !playback) onSettled(result);
    });
    return {
      cancel: () => playback?.cancel(),
      pause: () => playback?.pause(),
      resume: () => playback?.resume(),
    };
  }
  return startNativeNarration(text, onSettled, startImmediately);
}

function startNativeNarration(
  text: string,
  onSettled: (result: SpeechResult) => void,
  startImmediately: boolean,
): StoryNarration | null {
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return null;

  const engine = window.speechSynthesis;
  const speech = new SpeechSynthesisUtterance(text);
  speech.rate = 1;
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
      preferNaturalVoice(speech);
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
