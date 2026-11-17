import { useState, useEffect, useCallback, useMemo, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Lightbulb, Pause, Play } from 'lucide-react';
import type { StoryCard as StoryCardType, CalibrationCard, GroundingRef, ViewingStyle, PillarScore } from '../../types';
import type { VoiceSessionResult } from '../../lib/voice/useVoiceSession';
import { useAppStore } from '../../stores/appStore';
import { advanceBeat, advanceElapsed, beatDuration, canNarrateStory, chapterProgress, nextChapterFrame, storyTapDirection, voiceBlocksPlayback } from '../../lib/storyPlayback';
import { buildStoryFrames } from '../../lib/storyFrames';
import { storyTerms } from '../../lib/storyTerms';
import { formatStoryValue } from '../../lib/storyFormatting';
import { getFinancialTermDefinition, getSimpleFinancialTerm } from '../../lib/financialGlossary';
import { StoryCard } from './StoryCard';
import { StoryHelpContext } from './StoryHelpContext';
import { CalibrationBanner } from '../shared/CalibrationBanner';
import { FinancialText } from '../shared/FinancialText';
import { CalibrationMicroCard } from '../calibration/CalibrationMicroCard';
import { GroundingInspector } from '../calibration/GroundingInspector';
import { VoicePushButton } from '../shared/VoicePushButton';
import { useDialogFocus } from '../shared/useDialogFocus';

interface Props {
  caseId: string;
  stories: StoryCardType[];
  calibrationCards: Record<string, CalibrationCard>;
  pillars?: PillarScore[];
  voice: VoiceSessionResult;
  onComplete: () => void;
  onNavigateBack: () => void;
}

// The in-memory fallback keeps the same behavior when storage is unavailable.
const narrationVisits = new Map<string, number>();
function lastNarrated(key: string): number | undefined {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored !== null && Number.isFinite(Number(stored))) return Number(stored);
  } catch { /* Private browsing may block storage. */ }
  return narrationVisits.get(key);
}
function markNarrated(key: string, now: number) {
  narrationVisits.set(key, now);
  try { sessionStorage.setItem(key, String(now)); } catch { /* Memory fallback. */ }
}

function frameDuration(card: StoryCardType): number {
  return beatDuration([card.title, card.subtitle, card.tagline ?? '', card.highlightLabel ?? '', ...card.dataPoints.map((point) => `${point.label} ${point.value}`)].join(' '));
}

function TermsDialog({ terms, onClose, onSelect }: { terms: string[]; onClose: () => void; onSelect: (term: string) => void }) {
  const titleId = useId();
  const ref = useDialogFocus(true, onClose);
  const languageMode = useAppStore((state) => state.languageMode);
  return <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/65 p-5">
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-5 text-white shadow-xl">
      <div className="flex items-center justify-between gap-3"><h2 id={titleId} className="text-lg font-semibold">Terms in this story</h2><button type="button" onClick={onClose} aria-label="Close terms" className="min-h-11 min-w-11"><X className="mx-auto h-5 w-5" /></button></div>
      {terms.length ? <div className="mt-3 flex max-h-[55dvh] flex-col overflow-y-auto">{terms.map((term) => <button key={term.toLowerCase()} type="button" onClick={() => onSelect(term)} className="min-h-11 border-b border-white/10 py-2 text-left text-indigo-200 hover:text-white">{languageMode === 'simple' ? getSimpleFinancialTerm(term) : term}</button>)}</div> : <p className="mt-3 text-sm text-slate-300">No glossary terms appear in this story.</p>}
    </div>
  </div>;
}

export function StoryContainer({ caseId, stories, calibrationCards, pillars = [], voice, onComplete, onNavigateBack }: Props) {
  const questionId = useId();
  const preferredStyle = useAppStore((state) => state.viewingStyle);
  const [viewingStyle, setViewingStyle] = useState<ViewingStyle>(preferredStyle ?? 'visual');
  const frames = useMemo(() => buildStoryFrames(stories, viewingStyle), [stories, viewingStyle]);
  const [frameIndex, setFrameIndex] = useState(0);
  const elapsedRef = useRef(0);
  const [elapsed, setElapsed] = useState({ frameId: '', value: 0 });
  const frame = frames[Math.min(frameIndex, frames.length - 1)];
  const currentStory = frame?.card;
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
  const [isVoiceNarrating, setIsVoiceNarrating] = useState(false);
  const [checklistState, setChecklistState] = useState([false, false, false]);
  const attemptedChapter = useRef<string | null>(null);
  const pointerStart = useRef<{ x: number; y: number; at: number } | null>(null);
  const isAssistantActive = voiceBlocksPlayback(voice, voicePanelOpen);
  const modalOpen = Boolean(activeCalibration || activeGrounding || termsOpen || questionOpen || inlineHelpCount > 0);
  const terms = useMemo(() => chapter ? storyTerms([chapter.title, chapter.subtitle, chapter.tagline ?? '', chapter.highlightLabel ?? '', ...chapter.dataPoints.flatMap((point) => [point.label, String(point.value)])]) : [], [chapter]);

  useEffect(() => {
    const update = () => { setHidden(document.hidden); if (document.hidden) { setHolding(false); pointerStart.current = null; } };
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);
  useEffect(() => { if (preferredStyle) setViewingStyle(preferredStyle); }, [preferredStyle]);
  useEffect(() => {
    if (voice.detectedTerm) {
      const card = calibrationCards[voice.detectedTerm];
      if (card) setActiveCalibration(card);
      voice.clearDetectedTerm();
    }
  }, [voice.detectedTerm, calibrationCards, voice]);

  // Attempt once per chapter entry. Closing a dialog, stopping voice or returning
  // to a visible tab can cancel speech but must never trigger a replay.
  useEffect(() => {
    if (!chapter || !isVoiceNarrating || !('speechSynthesis' in window)) return;
    const entry = `${caseId}:${chapter.id}`;
    if (attemptedChapter.current === entry) return;
    attemptedChapter.current = entry;
    if (isAssistantActive || hidden || modalOpen || !chapter.voiceScript) return;
    const key = `sherpas:narration:${entry}`;
    const now = Date.now();
    if (!canNarrateStory(lastNarrated(key), now)) return;
    markNarrated(key, now);
    const utterance = new SpeechSynthesisUtterance(chapter.voiceScript);
    utterance.rate = 1.05;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [caseId, chapter, isVoiceNarrating, isAssistantActive, hidden, modalOpen]);
  useEffect(() => {
    if ((!isVoiceNarrating || isAssistantActive || hidden || modalOpen) && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [isVoiceNarrating, isAssistantActive, hidden, modalOpen]);
  useEffect(() => {
    if (!frame?.chapterId) return;
    const key = `sherpas:narration:${caseId}:${frame.chapterId}`;
    return () => { if (lastNarrated(key) !== undefined) markNarrated(key, Date.now()); };
  }, [caseId, frame?.chapterId]);
  useEffect(() => () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  const navigate = useCallback((index: number) => {
    const next = frames[index];
    if (!next) return;
    if (next.chapterId !== frame?.chapterId) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      attemptedChapter.current = null;
    }
    setCheckpoint(false);
    setFrameIndex(index);
  }, [frame?.chapterId, frames]);
  const goToNext = useCallback(() => {
    if (!frame || checkpoint) return;
    const next = advanceBeat(frame.partIndex, frame.partCount, false);
    if (next.checkpoint) setCheckpoint(true);
    else navigate(frameIndex + 1);
  }, [checkpoint, frame, frameIndex, navigate]);
  const goToPrev = useCallback(() => {
    if (!frame) return;
    if (checkpoint) { elapsedRef.current = 0; setElapsed({ frameId: frame.id, value: 0 }); setCheckpoint(false); return; }
    if (frame.partIndex > 0) navigate(frameIndex - 1);
  }, [checkpoint, frame, frameIndex, navigate]);
  const continueChapter = useCallback(() => {
    setPaused(false);
    setQuestionOpen(false);
    voice.stopSpeaking();
    voice.clearResponseMessage();
    voice.clearGuardRedirect();
    const next = nextChapterFrame(frameIndex, frames);
    if (next.complete) onComplete();
    else navigate(next.index);
  }, [frameIndex, frames, navigate, onComplete, voice]);
  const duration = currentStory ? frameDuration(currentStory) : 3000;
  const chapterDurations = frame ? frames.filter((item) => item.chapterId === frame.chapterId).map((item) => frameDuration(item.card)) : [];
  const chapterFraction = frame ? chapterProgress(chapterDurations, frame.partIndex, elapsed.frameId === frame.id ? elapsed.value : 0, checkpoint) : 0;
  useEffect(() => { elapsedRef.current = 0; }, [frame?.id]);
  useEffect(() => {
    if (paused || holding || hidden || modalOpen || isAssistantActive || checkpoint || !frame) return;
    let previous = performance.now();
    let request = 0;
    const tick = (now: number) => {
      elapsedRef.current = advanceElapsed(elapsedRef.current, now - previous, false, duration);
      previous = now;
      setElapsed({ frameId: frame.id, value: elapsedRef.current });
      if (elapsedRef.current >= duration) goToNext();
      else request = window.requestAnimationFrame(tick);
    };
    request = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(request);
  }, [paused, holding, hidden, modalOpen, isAssistantActive, checkpoint, frame, duration, goToNext]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || modalOpen || isAssistantActive ||
          target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"]')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); goToNext(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); goToPrev(); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goToNext, goToPrev, modalOpen, isAssistantActive]);

  function handleCalibrationOpen(termKey: string) {
    const card = calibrationCards[termKey];
    if (card) setActiveCalibration(card);
  }
  function selectTerm(term: string) {
    useAppStore.getState().trackTermConsulted(term, chapter?.id);
    setTermsOpen(false);
    setActiveCalibration({ term, termKey: term.toLowerCase(), headline: term, analogy: getFinancialTermDefinition(term), sherpasTake: '', numbers: [], groundingRefs: [] });
  }
  if (!currentStory || !frame) return null;

  return (
    <StoryHelpContext.Provider value={helpContext}><div data-phase={checkpoint ? "checkpoint" : "playing"} data-chapter-index={frame.chapterIndex} data-beat-progress={Math.min(1, (elapsed.frameId === frame.id ? elapsed.value : 0) / duration)} data-frame-id={frame.id} data-frame-index={frameIndex} data-frame-count={frames.length} className="story-shell relative mx-auto flex h-full w-full max-w-[960px] flex-col overflow-hidden bg-[#171827] shadow-2xl">
      <header className="shrink-0 px-4 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onNavigateBack} className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80" aria-label="Back to case selection"><X className="h-4 w-4" /></button>
          <div className="flex items-center gap-2">
            <button onClick={() => setPaused((value) => !value)} aria-pressed={paused} aria-label={paused ? "Resume story" : "Pause story"} className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}</button>
            <button onClick={() => setTermsOpen(true)} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200"><Lightbulb className="h-4 w-4 text-[#91a5ff]" />Terms</button>
            <button onClick={() => setIsVoiceNarrating((value) => !value)} aria-label={isVoiceNarrating ? 'Turn narration off' : 'Turn narration on'} aria-pressed={isVoiceNarrating} className="flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-200">{isVoiceNarrating ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}<span className="hidden sm:inline">{isVoiceNarrating ? 'Voice On' : 'Voice Off'}</span></button>
            <VoicePushButton compact onOverlayChange={setVoicePanelOpen} caseId={caseId} voiceState={voice.voiceState} transcript={voice.transcript} responseMessage={voice.responseMessage} guardRedirect={voice.guardRedirect} detectedTerm={voice.detectedTerm} showSuggestions={voice.showSuggestions} onPressStart={voice.startListening} onPressEnd={voice.stopListening} onStopSpeaking={voice.stopSpeaking} onSelectSuggestion={(q) => voice.pushToAsk(q)} onOpenCalibration={handleCalibrationOpen} onClosePopup={() => { voice.setShowSuggestions(false); voice.clearGuardRedirect(); voice.clearResponseMessage(); voice.stopSpeaking(); }} />
          </div>
        </div>
        <CalibrationBanner placement="inline" />
        <nav aria-label="Story steps" className="mt-2 flex gap-1 sm:gap-2">
          {stories.map((story, index) => {
            const firstFrame = frames.findIndex((item) => item.chapterIndex === index);
            const fill = index < frame.chapterIndex ? 100 : index === frame.chapterIndex ? chapterFraction * 100 : 0;
            return <button key={story.id} disabled={modalOpen || isAssistantActive || checkpoint} onClick={() => navigate(firstFrame)} aria-label={`Step ${index + 1} of ${stories.length}: ${story.title}`} aria-current={index === frame.chapterIndex ? 'step' : undefined} className="min-h-11 min-w-0 flex-1 rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><span role="progressbar" aria-label={`${story.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fill)} className="block h-1 overflow-hidden rounded-full bg-white/20"><span className="block h-full bg-white" style={{ width: `${fill}%` }} /></span><span className={`mt-1 hidden truncate text-xs sm:block ${index === frame.chapterIndex ? 'font-semibold text-white' : 'text-slate-400'}`}>{story.title}</span></button>;
          })}
        </nav>
      </header>
      <main className="relative min-h-0 flex-1 overflow-hidden" onPointerDown={(event) => { if (!modalOpen && !isAssistantActive && !(event.target as HTMLElement).closest('button, a, input, select, textarea, summary, [role="button"], [role="dialog"]')) { pointerStart.current = { x: event.clientX, y: event.clientY, at: Date.now() }; event.currentTarget.setPointerCapture(event.pointerId); setHolding(true); } else pointerStart.current = null; }} onPointerUp={(event) => { const start = pointerStart.current; pointerStart.current = null; setHolding(false); if (!start || Date.now() - start.at > 350 || modalOpen || isAssistantActive || (event.target as HTMLElement).closest('button, a, input, select, textarea, summary, [role="button"], [role="dialog"]')) return; const rect = event.currentTarget.getBoundingClientRect(); const direction = storyTapDirection(start.x - rect.left, start.y, event.clientX - rect.left, event.clientY, rect.width); if (direction === 'previous') goToPrev(); if (direction === 'next') goToNext(); }} onPointerCancel={() => { pointerStart.current = null; setHolding(false); }} onLostPointerCapture={() => { pointerStart.current = null; setHolding(false); }}>
        <AnimatePresence mode="wait">{!checkpoint && <motion.div key={frame.chapterId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="h-full w-full"><StoryCard card={currentStory} partIndex={frame.partIndex} partCount={frame.partCount} isActive={!modalOpen && !isAssistantActive && !hidden} pillars={pillars} viewingStyle={viewingStyle} onCalibrationOpen={handleCalibrationOpen} onInspectGrounding={setActiveGrounding} onSelectStyle={(style) => { const updated = buildStoryFrames(stories, style); const chapterFrames = updated.filter((item) => item.chapterId === frame.chapterId); const target = chapterFrames[Math.min(frame.partIndex, chapterFrames.length - 1)]; if (target) setFrameIndex(updated.indexOf(target)); setViewingStyle(style); useAppStore.getState().setViewingStyle(style); }} onActionComplete={goToNext} stepChecklist={checklistState} onToggleStep={(i) => setChecklistState((prev) => prev.map((value, index) => index === i ? !value : value))} /></motion.div>}</AnimatePresence>
        {checkpoint && chapter && <section className="mx-auto flex h-full max-w-xl flex-col px-5 pb-2 text-white" aria-label="Chapter checkpoint">
          <div className="shrink-0"><p className="text-xs font-semibold text-indigo-300">YOUR GUIDE · {frame.chapterIndex + 1} / {stories.length}</p><h1 className="mt-1 text-xl font-semibold">Anything you would like to clarify?</h1><p className="mt-1 text-sm text-slate-300">Review this chapter and ask a question, or continue when you are ready.</p></div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto rounded-xl border border-white/10 bg-white/5 px-4" aria-label="Chapter summary">
            {chapter.highlightNumber != null && <div className="border-b border-white/10 py-2"><p className="text-xs text-slate-400"><FinancialText text={chapter.highlightLabel || 'Highlight'} /></p><p className="break-words text-sm text-white"><FinancialText text={`${formatStoryValue(chapter.highlightNumber)}${chapter.highlightUnit ? ` ${chapter.highlightUnit}` : ''}`} /></p>{chapter.tagline && <p className="text-xs text-slate-300"><FinancialText text={chapter.tagline} /></p>}</div>}
            {chapter.dataPoints.map((point, index) => <div key={`${point.label}-${index}`} className="border-b border-white/10 py-2 last:border-0"><p className="text-xs text-slate-400"><FinancialText text={point.label.replace(/_/g, ' ')} /></p><p className="break-words text-sm text-white"><FinancialText text={`${formatStoryValue(point.value)}${point.unit ? ` ${point.unit}` : ''}`} /></p></div>)}
          </div>
          <div className="shrink-0 pt-3">{questionOpen ? <form onSubmit={(event) => { event.preventDefault(); if (question.trim()) { voice.pushToAsk(question); setQuestion(''); } }}><label htmlFor={questionId} className="sr-only">Your question</label><div className="flex gap-2"><input id={questionId} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about this chapter" className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/20 bg-white/5 px-3 text-sm" /><button type="submit" disabled={!question.trim()} className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold disabled:opacity-40">Ask</button></div>{voice.isSpeaking && <p className="mt-1 text-xs text-slate-300">Waiting for a response…</p>}{(voice.responseMessage || voice.guardRedirect) && <p className="mt-1 max-h-16 overflow-y-auto text-xs text-slate-200"><FinancialText text={voice.guardRedirect ?? voice.responseMessage ?? ''} /></p>}{voice.errorNotice && <p className="mt-1 text-xs text-slate-300">{voice.errorNotice}</p>}</form> : <button type="button" onClick={() => setQuestionOpen(true)} className="min-h-11 text-sm font-semibold text-indigo-200 underline">I have a question</button>}<button type="button" onClick={continueChapter} className="ml-3 min-h-11 rounded-xl bg-[#4565d6] px-5 text-sm font-semibold text-white">Continue</button></div>
        </section>}
      </main>
      <button type="button" onClick={goToPrev} disabled={frameIndex === 0 || modalOpen || isAssistantActive} className="sr-only focus:not-sr-only">Previous story page</button><button type="button" onClick={goToNext} disabled={modalOpen || isAssistantActive} className="sr-only focus:not-sr-only">Next story page</button>
      {termsOpen && <TermsDialog terms={terms} onClose={() => setTermsOpen(false)} onSelect={selectTerm} />}
      <AnimatePresence>{activeCalibration && <CalibrationMicroCard card={activeCalibration} onDismiss={() => setActiveCalibration(null)} onInspectGrounding={setActiveGrounding} />}</AnimatePresence>
      <GroundingInspector grounding={activeGrounding} onClose={() => setActiveGrounding(null)} />
    </div></StoryHelpContext.Provider>
  );
}
