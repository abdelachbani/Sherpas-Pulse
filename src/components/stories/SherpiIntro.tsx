import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SherpiAvatar } from '../shared/SherpiAvatar';
import './sherpi-intro.css';

export const SHERPI_INTRO_STEPS = [
  { control: null, title: 'Hi, I’m Sherpi', text: 'I’ll guide you through your plan. We’ll stop at key figures to review and answer questions.' },
  { control: 'playback', title: 'Take your time', text: 'Pause anytime to review at your own pace, or press Play to carry on.' },
  { control: 'terms', title: 'Look up terms', text: 'Tap Terms for words from this chapter. Switch between Everyday Analogy and Financial Mechanics.' },
  { control: 'voice', title: 'Voice on or off', text: 'Tap the speaker to mute or enable my voice narration.' },
  { control: 'sherpi', title: 'Ask me anything', text: 'Tap Sherpi to type a question, or hold to speak.' },
  { control: null, title: 'Ready to look at your plan?', text: 'We’ll start with your financial health.' },
] as const;

export function SherpiIntro({ stepIndex, voiceEnabled, hidden, onNext, onFinish }: {
  stepIndex: number;
  voiceEnabled: boolean;
  hidden: boolean;
  onNext: () => void;
  onFinish: () => void;
}) {
  const step = SHERPI_INTRO_STEPS[stepIndex];
  const ready = stepIndex === SHERPI_INTRO_STEPS.length - 1;
  const [needsAudioGesture, setNeedsAudioGesture] = useState(false);
  const requestSpeech = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (hidden) return;
    let timeout = 0;
    let utterance: SpeechSynthesisUtterance | null = null;
    let active = true;
    let spokenAt = 0;
    const readingTime = Math.min(14_000, Math.max(5_000, step.text.split(' ').length * 380));
    const schedule = (delay: number) => {
      if (ready) return;
      window.clearTimeout(timeout);
      timeout = window.setTimeout(onNext, delay);
    };
    schedule(readingTime);

    if (voiceEnabled && 'speechSynthesis' in window) {
      const speak = () => {
        if (!active || utterance) return;
        setNeedsAudioGesture(false);
        spokenAt = performance.now();
        const speech = new SpeechSynthesisUtterance(`${step.title}. ${step.text}`);
        utterance = speech;
        speech.lang = 'en-US';
        speech.rate = 1.05;
        speech.onstart = () => { if (active) schedule(25_000); };
        speech.onend = () => {
          utterance = null;
          if (active) schedule(Math.max(650, 2200 - (performance.now() - spokenAt)));
        };
        speech.onerror = (event) => {
          utterance = null;
          if (!active) return;
          setNeedsAudioGesture(event.error === 'not-allowed');
          schedule(readingTime);
        };
        window.speechSynthesis.speak(speech);
      };
      requestSpeech.current = speak;
      speak();
    }

    return () => {
      active = false;
      requestSpeech.current = null;
      window.clearTimeout(timeout);
      if (utterance) window.speechSynthesis.cancel();
    };
  }, [hidden, onNext, ready, step, voiceEnabled]);

  return (
    <section className="sherpi-intro" aria-label="Sherpi’s introduction">
      <div className="sherpi-intro-inner">
        <div className="sherpi-intro-copy">
          <SherpiAvatar large />
          <div className="sherpi-intro-message" aria-live="polite" aria-atomic="true">
            {stepIndex > 0 && <p className="sherpi-intro-caption">Sherpi {ready ? '' : `· ${stepIndex} / 4`}</p>}
            <h1>{step.title}</h1>
            <p>{step.text}</p>
          </div>
        </div>
        <div className="sherpi-intro-actions">
          <button type="button" className="sherpi-intro-skip" onClick={onFinish}>Skip introduction</button>
          {needsAudioGesture && voiceEnabled && <button type="button" className="sherpi-intro-skip" onClick={() => requestSpeech.current?.()}>Play voice</button>}
          <button type="button" className="sherpi-intro-next" onClick={ready ? onFinish : onNext}>
            {ready ? 'Start my plan' : 'Next'} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
