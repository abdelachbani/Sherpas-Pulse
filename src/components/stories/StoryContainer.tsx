import { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Lightbulb, Pause, Play } from 'lucide-react';
import type { StoryCard as StoryCardType, CalibrationCard, GroundingRef, ViewingStyle } from '../../types';
import type { VoiceSessionResult } from '../../lib/voice/useVoiceSession';
import { useAppStore } from '../../stores/appStore';
import { advanceBeat, advanceElapsed, beatDuration, chapterProgress, nextChapterFrame, storyTapDirection, voiceBlocksPlayback } from '../../lib/storyPlayback';
import { startStoryNarration, type StoryNarration } from '../../lib/storyNarration';
import { hasReachedHesitationThreshold, HESITATION_PAUSE_MS } from '../../lib/telemetry';
import { buildStoryFrames } from '../../lib/storyFrames';
import { storyTerms } from '../../lib/storyTerms';
import { formatStoryValue } from '../../lib/storyFormatting';
import { getFinancialTermDefinition, getFinancialTermMechanics, getSimpleFinancialTerm } from '../../lib/financialGlossary';
import { StoryCard } from './StoryCard';
import { StoryHelpContext } from './StoryHelpContext';
import { CalibrationBanner } from '../shared/CalibrationBanner';
import { FinancialText } from '../shared/FinancialText';
import { CalibrationMicroCard } from '../calibration/CalibrationMicroCard';
import { GroundingInspector } from '../calibration/GroundingInspector';
import { VoicePushButton } from '../shared/VoicePushButton';
import { SherpiAvatar } from '../shared/SherpiAvatar';
import { SherpiIntro } from './SherpiIntro';
import { SHERPI_INTRO_STEPS } from '../../lib/sherpiIntro';
import { useDialogFocus } from '../shared/useDialogFocus';

interface Props {
  caseId: string;
  stories: StoryCardType[];
  calibrationCards: Record<string, CalibrationCard>;
  viewingStyle: ViewingStyle;
  voice: VoiceSessionResult;
  onComplete: () => void;
  onNavigateBack: () => void;
}

const narrationPreferenceKey = 'sherpas:voice-enabled';
let voicePreference = true;

function prefersVoice() {
  try {
    const saved = sessionStorage.getItem(narrationPreferenceKey);
    return saved === null ? voicePreference : saved === 'true';
  } catch { return voicePreference; }
}
function frameDuration(card: StoryCardType, introduction: boolean, style: ViewingStyle): number {
  const reading = beatDuration([card.title, card.subtitle, card.tagline ?? '', card.highlightLabel ?? '', card.highlightNumber ?? '', ...card.dataPoints.map((point) => `${point.label} ${point.value}`)].join(' '), style);
  return introduction ? Math.max(reading, beatDuration(card.voiceScript ?? '')) : reading;
}

function TermsDialog({ terms, onClose, onSelect }: { terms: string[]; onClose: () => void; onSelect: (term: string) => void }) {
  const titleId = useId();
  const ref = useDialogFocus(true, onClose);
  const languageMode = useAppStore((state) => state.languageMode);
  const setLanguageMode = useAppStore((state) => state.setLanguageMode);
  const languageAction = languageMode === 'simple' ? 'Use standard language' : 'Use simpler language';
  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-5">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-lg font-semibold">Terms in this story</h2><button type="button" onClick={onClose} aria-label="Close terms" className="min-h-11 min-w-11"><X className="mx-auto h-5 w-5" /></button></div>
      {terms.length ? <div className="mt-3 flex max-h-[55dvh] flex-col overflow-y-auto">{terms.map((term) => <button key={term.toLowerCase()} type="button" onClick={() => onSelect(term)} className="min-h-11 border-b border-white/10 py-2 text-left text-indigo-200 hover:text-white">{languageMode === 'simple' ? getSimpleFinancialTerm(term) : term}</button>)}</div> : <p className="mt-3 text-sm text-slate-300">No glossary terms appear in this story.</p>}
      <button type="button" aria-label={languageAction} onClick={() => setLanguageMode(languageMode === 'simple' ? 'standard' : 'simple')} className="mt-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-indigo-200 hover:bg-white/10">{languageAction}</button>
    </div>
  </div>;
}

export function StoryContainer({ caseId, stories, calibrationCards, viewingStyle, voice, onComplete, onNavigateBack }: Props) {
  const questionId = useId();
  const mainRef = useRef<HTMLElement>(null);
  const [introStep, setIntroStep] = useState<number | null>(0);
  const introActive = introStep !== null;
  const highlightedControl = introActive ? SHERPI_INTRO_STEPS[introStep].control : null;
  const advanceIntro = useCallback(() => {
    setIntroStep((step) => step === null ? step : Math.min(step + 1, SHERPI_INTRO_STEPS.length - 1));
  }, []);
  const finishIntro = useCallback(() => {
    setIntroStep(null);
    mainRef.current?.focus({ preventScroll: true });
  }, []);
  const frames = useMemo(() => buildStoryFrames(stories, viewingStyle), [stories, viewingStyle]);
  const [frameIndex, setFrameIndex] = useState(0);
  const elapsedRef = useRef(0);
  const [elapsed, setElapsed] = useState({ frameId: '', value: 0 });
  const [activityRevision, setActivityRevision] = useState(0);
  const lastActivityAt = useRef(Date.now());
  const markStoryActivity = useCallback(() => {
    lastActivityAt.current = Date.now();
    setActivityRevision((revision) => revision + 1);
  }, []);
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const currentStory = frame?.card;
  const narrationScript = currentStory?.voiceScript;
  const chapter = frame ? stories[frame.chapterIndex] : undefined;
  const [checkpoint, setCheckpoint] = useState(false);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [activeCalibration, setActiveCalibration] = useState<CalibrationCard | null>(null);
  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const [inlineHelpCount, setInlineHelpCount] = useState(0);
  const openInlineHelp = useCallback(() => setInlineHelpCount((count) => count + 1), []);
  const closeInlineHelp = useCallback(() => setInlineHelpCount((count) => Math.max(0, count - 1)), []);
  const helpContext = useMemo(() => ({ onOpen: openInlineHelp, onClose: closeInlineHelp }), [openInlineHelp, closeInlineHelp]);
  const [isVoiceNarrating, setIsVoiceNarrating] = useState(prefersVoice);
  const { setAudioMuted } = voice;
  useEffect(() => { setAudioMuted(!isVoiceNarrating); }, [isVoiceNarrating, setAudioMuted]);
  function toggleVoice() {
    const enabled = !isVoiceNarrating;
    voicePreference = enabled;
    try { sessionStorage.setItem(narrationPreferenceKey, String(enabled)); } catch { /* Memory fallback. */ }
    setAudioMuted(!enabled);
    setIsVoiceNarrating(enabled);
  }
  const attemptedChapter = useRef<string | null>(null);
  const narrationRef = useRef<StoryNarration | null>(null);
  const stopNarration = useCallback(() => {
    narrationRef.current?.cancel();
    narrationRef.current = null;
  }, []);
  function togglePlayback() {
    if (paused) narrationRef.current?.resume();
    else narrationRef.current?.pause();
    setPaused(!paused);
  }
  const pointerStart = useRef<{ x: number; y: number; at: number } | null>(null);
  const isAssistantActive = voiceBlocksPlayback(voice, voicePanelOpen);
  const modalOpen = Boolean(activeCalibration || activeGrounding || termsOpen || questionOpen || inlineHelpCount > 0);
  const terms = useMemo(() => chapter ? storyTerms([chapter.title, chapter.subtitle, chapter.tagline ?? '', chapter.highlightLabel ?? '', ...chapter.dataPoints.flatMap((point) => [point.label, String(point.value)])]) : [], [chapter]);

  useEffect(() => {
    const update = () => {
      const isHidden = document.hidden;
      setHidden(isHidden);
      if (isHidden) { setHolding(false); pointerStart.current = null; }
      else markStoryActivity();
    };
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [markStoryActivity]);
  const voiceExplanation = voice.detectedTerm ? calibrationCards[voice.detectedTerm] : undefined;
  function explainAnsweredTerm() {
    if (voiceExplanation) setActiveCalibration(voiceExplanation);
    voice.clearDetectedTerm();
  }

  // Attempt once per chapter entry. Closing a dialog, stopping voice or returning
  // to a visible tab can cancel speech but must never trigger a replay.
  useEffect(() => {
    if (introActive || paused || checkpoint || !chapter || !isVoiceNarrating) return;
    const entry = `${caseId}:${chapter.id}`;
    if (attemptedChapter.current === entry) return;
    attemptedChapter.current = entry;
    if (isAssistantActive || hidden || modalOpen || !narrationScript) return;
    narrationRef.current = startStoryNarration(narrationScript, () => {
      narrationRef.current = null;
      markStoryActivity();
    });
  }, [caseId, chapter, checkpoint, introActive, isVoiceNarrating, isAssistantActive, hidden, modalOpen, paused, markStoryActivity, narrationScript]);
  useEffect(() => {
    if (!isVoiceNarrating || isAssistantActive || hidden || modalOpen) stopNarration();
  }, [isVoiceNarrating, isAssistantActive, hidden, modalOpen, stopNarration]);
  useEffect(() => stopNarration, [stopNarration]);

  const navigate = useCallback((index: number) => {
    const next = frames[index];
    if (!next || (index === frameIndex && !checkpoint)) return;
    stopNarration();
    if (next.chapterId !== frame?.chapterId) {
      attemptedChapter.current = null;
      setPaused(false);
    }
    setCheckpoint(false);
    setFrameIndex(index);
  }, [checkpoint, frame?.chapterId, frameIndex, frames, stopNarration]);

  function askSherpi(questionText: string) {
    stopNarration();
    voice.pushToAsk(questionText);
  }
  const goToNext = useCallback(() => {
    if (!frame || checkpoint) return;
    const next = advanceBeat(frame.partIndex, frame.partCount, false);
    if (next.checkpoint) {
      stopNarration();
      setCheckpoint(true);
    }
    else navigate(frameIndex + 1);
  }, [checkpoint, frame, frameIndex, navigate, stopNarration]);
  const goToPrev = useCallback(() => {
    if (!frame) return;
    if (checkpoint) { elapsedRef.current = 0; setElapsed({ frameId: frame.id, value: 0 }); setCheckpoint(false); return; }
    if (frame.partIndex > 0) navigate(frameIndex - 1);
    else if (frame.chapterIndex > 0) navigate(frames.findIndex((item) => item.chapterIndex === frame.chapterIndex - 1));
  }, [checkpoint, frame, frameIndex, frames, navigate]);
  const continueChapter = useCallback(() => {
    setPaused(false);
    setQuestionOpen(false);
    setQuestion('');
    voice.stopSpeaking();
    voice.clearResponseMessage();
    voice.clearGuardRedirect();
    voice.clearDetectedTerm();
    voice.clearErrorNotice();
    voice.setShowSuggestions(false);
    const next = nextChapterFrame(frameIndex, frames);
    if (next.complete) onComplete();
    else navigate(next.index);
  }, [frameIndex, frames, navigate, onComplete, voice]);
  const duration = currentStory ? frameDuration(currentStory, frame.partIndex === 0, viewingStyle) : 3000;
  const chapterDurations = frame ? frames.filter((item) => item.chapterId === frame.chapterId).map((item) => frameDuration(item.card, item.partIndex === 0, viewingStyle)) : [];
  const revealProgress = elapsed.frameId === frame?.id ? Math.min(1, elapsed.value / duration) : 0;
  const chapterFraction = frame ? chapterProgress(chapterDurations, frame.partIndex, elapsed.frameId === frame.id ? elapsed.value : 0, checkpoint) : 0;
  useEffect(() => {
    elapsedRef.current = 0;
    lastActivityAt.current = Date.now();
  }, [frame?.id]);
  useEffect(() => {
    if (introActive || !frame || !chapter || paused || holding || hidden || modalOpen || isAssistantActive || checkpoint) return;
    const timer = window.setTimeout(() => {
      if (narrationRef.current) return;
      const inactiveMs = Date.now() - lastActivityAt.current;
      if (!hasReachedHesitationThreshold(inactiveMs)) return;
      useAppStore.getState().trackHesitationPause({
        frameId: frame.id,
        chapterId: frame.chapterId,
        chapterTitle: chapter.title,
        chapterIndex: frame.chapterIndex,
        partIndex: frame.partIndex,
        inactiveMs,
      }, chapter.id);
    }, HESITATION_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [activityRevision, frame, chapter, introActive, paused, holding, hidden, modalOpen, isAssistantActive, checkpoint]);
  useEffect(() => {
    if (introActive || paused || holding || hidden || modalOpen || isAssistantActive || checkpoint || !frame) return;
    let previous = performance.now();
    let request = 0;
    const tick = (now: number) => {
      // Keep the beat visible, with its details revealed, until Sherpi finishes.
      const limit = narrationRef.current ? Math.max(elapsedRef.current, duration * 0.96) : duration;
      elapsedRef.current = advanceElapsed(elapsedRef.current, now - previous, false, limit);
      previous = now;
      setElapsed({ frameId: frame.id, value: elapsedRef.current });
      if (elapsedRef.current >= duration && !narrationRef.current) goToNext();
      else request = window.requestAnimationFrame(tick);
    };
    request = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(request);
  }, [introActive, paused, holding, hidden, modalOpen, isAssistantActive, checkpoint, frame, duration, goToNext]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (introActive || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || modalOpen || isAssistantActive ||
          target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"]')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); goToNext(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goToPrev(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToNext, goToPrev, introActive, modalOpen, isAssistantActive]);

  function selectTerm(term: string) {
    useAppStore.getState().trackTermConsulted(term, chapter?.id);
    setTermsOpen(false);
    setActiveCalibration({ term, termKey: term.toLowerCase(), headline: term, analogy: getFinancialTermDefinition(term), expertMechanics: getFinancialTermMechanics(term), sherpasTake: '', numbers: [], groundingRefs: [] });
  }
  if (!currentStory || !frame) return null;

  return (
    <StoryHelpContext.Provider value={helpContext}><div onPointerDownCapture={markStoryActivity} onPointerUpCapture={markStoryActivity} onPointerCancelCapture={markStoryActivity} onKeyDownCapture={markStoryActivity} onClickCapture={markStoryActivity} onWheelCapture={markStoryActivity} data-phase={introActive ? "intro" : checkpoint ? "checkpoint" : "playing"} data-chapter-index={frame.chapterIndex} data-viewing-style={viewingStyle} data-beat-progress={revealProgress} data-frame-id={frame.id} data-frame-index={frameIndex} data-frame-count={frames.length} className="story-shell relative mx-auto flex h-full w-full flex-col overflow-hidden bg-[#171827] shadow-2xl">
      <header className="shrink-0 px-4 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onNavigateBack} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80" aria-label="Back to case selection"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-2">
            <button disabled={introActive} data-intro-control="playback" data-intro-current={highlightedControl === "playback" || undefined} onClick={togglePlayback} aria-pressed={paused} aria-label={paused ? "Resume story" : "Pause story"} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
            <button disabled={introActive} data-intro-control="terms" data-intro-current={highlightedControl === "terms" || undefined} onClick={() => setTermsOpen(true)} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200"><Lightbulb className="h-4 w-4 text-[#91a5ff]" />Terms</button>
            <button data-intro-control="voice" data-intro-current={highlightedControl === "voice" || undefined} onClick={toggleVoice} aria-label={isVoiceNarrating ? 'Turn narration off' : 'Turn narration on'} aria-pressed={isVoiceNarrating} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200">{isVoiceNarrating ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span className="hidden sm:inline">{isVoiceNarrating ? 'Voice On' : 'Voice Off'}</span></button>
            <div inert={introActive} data-intro-control="sherpi" data-intro-current={highlightedControl === "sherpi" || undefined}>
              <VoicePushButton
                key={frame.chapterId}
                onOverlayChange={setVoicePanelOpen}
                voiceState={voice.voiceState}
                transcript={voice.transcript}
                responseMessage={voice.responseMessage}
                guardRedirect={voice.guardRedirect}
                errorNotice={voice.errorNotice}
                audioLevel={voice.audioLevel}
                termToExplain={voiceExplanation?.term}
                onExplainTerm={explainAnsweredTerm}
                suggestedQuestion={terms[0] ? `What does “${terms[0]}” mean for my plan?` : 'What should I take away from this chapter?'}
                onPressStart={() => { stopNarration(); voice.startListening(); }}
                onPressEnd={voice.stopListening}
                onStopSpeaking={voice.stopSpeaking}
                onSelectSuggestion={askSherpi}
                onClosePopup={() => { voice.setShowSuggestions(false); voice.clearGuardRedirect(); voice.clearResponseMessage(); voice.clearDetectedTerm(); voice.clearErrorNotice(); voice.stopSpeaking(); }}
              />
            </div>
          </div>
        </div>
        {!introActive && <CalibrationBanner />}
        {!introActive && <nav aria-label="Story steps" className="mt-2 flex gap-1 sm:gap-2">
          {stories.map((story, index) => {
            const firstFrame = frames.findIndex((item) => item.chapterIndex === index);
            const fill = index < frame.chapterIndex ? 100 : index === frame.chapterIndex ? chapterFraction * 100 : 0;
            return <button key={story.id} disabled={modalOpen || isAssistantActive || (checkpoint && index >= frame.chapterIndex)} onClick={() => navigate(firstFrame)} aria-label={`Step ${index + 1} of ${stories.length}: ${story.title}`} aria-current={index === frame.chapterIndex ? 'step' : undefined} className="min-h-11 min-w-0 flex-1 rounded text-left focus-visible:outline focus-visible:outline-white"><span role="progressbar" aria-label={`${story.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill)} className="block h-1 overflow-hidden rounded-full bg-white/20"><span className="block h-full bg-white" style={{ width: `${fill}%` }} /></span><span className={`mt-1 hidden truncate text-xs sm:block ${index === frame.chapterIndex ? 'font-semibold text-white' : 'text-slate-400'}`}>{story.title}</span></button>;
          })}
        </nav>}
      </header>
      <main ref={mainRef} tabIndex={-1} className="relative min-h-0 flex-1 overflow-hidden" onPointerDown={(event) => { if (!introActive && !modalOpen && !isAssistantActive && !(event.target as HTMLElement).closest('button, a, input, select, textarea, summary, [role="button"], [role="dialog"]')) { pointerStart.current = { x: event.clientX, y: event.clientY, at: Date.now() }; event.currentTarget.setPointerCapture(event.pointerId); setHolding(true); } else pointerStart.current = null; }} onPointerUp={(event) => { const start = pointerStart.current; pointerStart.current = null; setHolding(false); if (!start || Date.now() - start.at > 350 || modalOpen || isAssistantActive || (event.target as HTMLElement).closest('button, a, input, select, textarea, summary, [role="button"], [role="dialog"]')) return; const rect = event.currentTarget.getBoundingClientRect(); const direction = storyTapDirection(start.x - rect.left, start.y, event.clientX - rect.left, event.clientY, rect.width); if (direction === 'previous') goToPrev(); if (direction === 'next') goToNext(); }} onPointerCancel={() => { pointerStart.current = null; setHolding(false); }} onLostPointerCapture={() => { pointerStart.current = null; setHolding(false); }}>
        {introStep !== null && <SherpiIntro stepIndex={introStep} voiceEnabled={isVoiceNarrating} hidden={hidden} onNext={advanceIntro} onFinish={finishIntro} />}
        <AnimatePresence mode="wait">{!introActive && !checkpoint && <motion.div key={frame.chapterId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full w-full"><StoryCard card={currentStory} revealProgress={revealProgress} viewingStyle={viewingStyle} /></motion.div>}</AnimatePresence>
        {checkpoint && chapter && <section className="mx-auto flex h-full max-w-xl flex-col px-5 pb-2 text-white" aria-label="Chapter checkpoint">
          <div className="flex shrink-0 items-start gap-3">
            <SherpiAvatar large />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-300">Sherpi · {frame.chapterIndex + 1} / {stories.length}</p>
              <h1 className="mt-1 text-xl font-semibold">Anything you would like to clarify?</h1>
              <p className="mt-1 text-sm text-slate-300">Keep the figures in view while we talk.</p>
            </div>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 px-4" aria-label="Chapter summary">
            {chapter.highlightNumber != null && <div className="border-b border-white/10 py-2"><p className="text-xs text-slate-400"><FinancialText text={chapter.highlightLabel || 'Highlight'} /></p><p className="wrap-break-word text-sm text-white"><FinancialText text={`${formatStoryValue(chapter.highlightNumber)}${chapter.highlightUnit ? ` ${chapter.highlightUnit}` : ''}`} /></p>{chapter.tagline && <p className="text-xs text-slate-300"><FinancialText text={chapter.tagline} /></p>}</div>}
            {chapter.dataPoints.map((point, index) => <div key={`${point.label}-${index}`} className="border-b border-white/10 py-2 last:border-0"><p className="text-xs text-slate-400"><FinancialText text={point.label.replace(/_/g, ' ')} /></p><p className="wrap-break-word text-sm text-white"><FinancialText text={`${formatStoryValue(point.value, viewingStyle === "analytical" ? "day" : "month")}${point.unit ? ` ${point.unit}` : ''}`} /></p></div>)}
          </div>
          <div className="shrink-0 pt-2">
            {questionOpen && <form onSubmit={(event) => {
              event.preventDefault();
              if (!question.trim()) return;
              askSherpi(question.trim());
              setQuestion('');
            }}>
              <label htmlFor={questionId} className="sr-only">Your question for Sherpi</label>
              <div className="flex gap-2">
                <input id={questionId} autoFocus value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this chapter" className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/20 bg-white/5 px-3 text-sm placeholder:text-slate-400" />
                <button type="submit" disabled={!question.trim()} className="min-h-11 rounded-lg border border-white/20 px-4 text-sm font-semibold disabled:opacity-40">Ask</button>
              </div>
              <div aria-live="polite">
                {voice.isSpeaking && !voice.responseMessage && !voice.guardRedirect && <p className="mt-1 text-xs text-slate-300">Sherpi is preparing an answer…</p>}
                {(voice.responseMessage || voice.guardRedirect) && <p className="mt-1 max-h-16 overflow-y-auto text-sm text-slate-200"><FinancialText text={voice.guardRedirect ?? voice.responseMessage ?? ''} /></p>}
                {voice.responseMessage && !voice.isSpeaking && voiceExplanation && <button type="button" onClick={explainAnsweredTerm} className="min-h-11 text-left text-sm font-semibold text-indigo-200 underline">Explain {voiceExplanation.term}</button>}
                {voice.errorNotice && <p className="mt-1 text-xs text-slate-300">{voice.errorNotice}</p>}
              </div>
            </form>}
            <div className="mt-1 flex items-center justify-between gap-2">
              {!questionOpen && <button type="button" onClick={() => setQuestionOpen(true)} className="min-h-11 text-sm font-semibold text-indigo-200 underline underline-offset-4">I have a question</button>}
              <button type="button" onClick={continueChapter} className="ml-auto min-h-11 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white">Continue</button>
            </div>
          </div>
        </section>}
      </main>
      <button type="button" onClick={goToPrev} disabled={introActive || frameIndex === 0 || modalOpen || isAssistantActive} className="sr-only focus:not-sr-only">Previous story page</button><button type="button" onClick={goToNext} disabled={introActive || modalOpen || isAssistantActive} className="sr-only focus:not-sr-only">Next story page</button>
      {termsOpen && <TermsDialog terms={terms} onClose={() => setTermsOpen(false)} onSelect={selectTerm} />}
      <AnimatePresence>{activeCalibration && <CalibrationMicroCard card={activeCalibration} onDismiss={() => setActiveCalibration(null)} onInspectGrounding={setActiveGrounding} />}</AnimatePresence>
      <GroundingInspector grounding={activeGrounding} onClose={() => setActiveGrounding(null)} />
    </div></StoryHelpContext.Provider>
  );
}
