import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { SherpiAvatar } from '../shared/SherpiAvatar';
import { startStoryNarration, type StoryNarration } from '../../lib/storyNarration';
import { SHERPI_INTRO_STEPS } from '../../lib/sherpiIntro';
import './sherpi-intro.css';

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
  const stopStep = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (hidden) return;
    let timeout = 0;
    let narration: StoryNarration | null = null;
    const visibleSince = performance.now();
    const readingTime = Math.min(14_000, Math.max(5_000, step.text.split(' ').length * 380));
    const schedule = (delay: number) => {
      if (ready) return;
      window.clearTimeout(timeout);
      timeout = window.setTimeout(onNext, delay);
    };
    function speak(immediate = false) {
      if (narration) return;
      window.clearTimeout(timeout);
      setNeedsAudioGesture(false);
      narration = startStoryNarration(`${step.title}. ${step.text}`, (result) => {
        narration = null;
        setNeedsAudioGesture(result === 'blocked');
        const minimumTime = result === 'finished' ? 2200 : readingTime;
        schedule(Math.max(650, minimumTime - (performance.now() - visibleSince)));
      }, immediate);
      if (!narration) schedule(readingTime);
    }

    if (voiceEnabled) speak();
    else schedule(readingTime);
    requestSpeech.current = voiceEnabled ? () => speak(true) : null;
    function stop() {
      window.clearTimeout(timeout);
      narration?.cancel();
      narration = null;
    }
    stopStep.current = stop;
    return () => {
      stop();
      requestSpeech.current = null;
      stopStep.current = null;
    };
  }, [hidden, onNext, ready, step, voiceEnabled]);

  function leaveStep(action: () => void) {
    stopStep.current?.();
    action();
  }

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
          <button type="button" className="sherpi-intro-skip" onClick={() => leaveStep(onFinish)}>Skip introduction</button>
          {needsAudioGesture && voiceEnabled && <button type="button" className="sherpi-intro-skip" onClick={() => requestSpeech.current?.()}>Play voice</button>}
          <button type="button" className="sherpi-intro-next" onClick={() => leaveStep(ready ? onFinish : onNext)}>
            {ready ? 'Start my plan' : 'Next'} <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
