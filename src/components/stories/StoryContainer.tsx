import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, X, Lightbulb } from 'lucide-react';
import type { StoryCard as StoryCardType, CalibrationCard, GroundingRef, ViewingStyle, PillarScore } from '../../types';
import type { VoiceSessionResult } from '../../lib/voice/useVoiceSession';
import { useAppStore } from '../../stores/appStore';
import { nextStory, previousStory, shouldAdvancePlayback, voiceBlocksPlayback } from '../../lib/storyPlayback';
import { StoryCard } from './StoryCard';
import { CalibrationMicroCard } from '../calibration/CalibrationMicroCard';
import { GroundingInspector } from '../calibration/GroundingInspector';
import { VoicePushButton } from '../shared/VoicePushButton';

interface Props {
  caseId: string;
  stories: StoryCardType[];
  calibrationCards: Record<string, CalibrationCard>;
  pillars?: PillarScore[];
  voice: VoiceSessionResult;
  onComplete: () => void;
  onNavigateBack: () => void;
}

const STORY_DURATION_MS = 25000;

export function StoryContainer({ caseId, stories, calibrationCards, pillars = [], voice, onComplete, onNavigateBack }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [voicePanelOpen, setVoicePanelOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const preferredStyle = useAppStore((state) => state.viewingStyle);
  const [viewingStyle, setViewingStyle] = useState<ViewingStyle>(preferredStyle ?? 'visual');
  const [activeCalibration, setActiveCalibration] = useState<CalibrationCard | null>(null);
  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);
  const [isVoiceNarrating, setIsVoiceNarrating] = useState(false);
  const [checklistState, setChecklistState] = useState([false, false, false]);
  const currentStory = stories[currentIndex];
  const isAssistantActive = voiceBlocksPlayback(voice, voicePanelOpen);
  const modalOpen = Boolean(activeCalibration || activeGrounding);
  const advancing = shouldAdvancePlayback(playing, hidden, modalOpen, isAssistantActive);

  useEffect(() => {
    const update = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (voice.detectedTerm) {
      const card = calibrationCards[voice.detectedTerm];
      if (card) setActiveCalibration(card);
      voice.clearDetectedTerm();
    }
  }, [voice.detectedTerm, calibrationCards, voice]);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isVoiceNarrating && !isAssistantActive && !hidden && !modalOpen && currentStory?.voiceScript) {
      const utterance = new SpeechSynthesisUtterance(currentStory.voiceScript);
      utterance.rate = 1.05;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
    return () => window.speechSynthesis.cancel();
  }, [currentIndex, currentStory?.voiceScript, isVoiceNarrating, isAssistantActive, hidden, modalOpen]);

  const goToNext = useCallback(() => {
    const result = nextStory(currentIndex, stories.length);
    if (result.complete) {
      setPlaying(false);
      onComplete();
    } else {
      setCurrentIndex(result.index);
      setProgress(0);
    }
  }, [currentIndex, stories.length, onComplete]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(previousStory(currentIndex).index);
    setProgress(0);
  }, [currentIndex]);

  useEffect(() => {
    if (!advancing) return;
    const timer = window.setInterval(() => setProgress((value) => Math.min(100, value + 50 / STORY_DURATION_MS * 100)), 50);
    return () => window.clearInterval(timer);
  }, [advancing]);

  useEffect(() => {
    if (advancing && progress >= 100) goToNext();
  }, [advancing, progress, goToNext]);

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
    const card = calibrationCards[termKey] ?? calibrationCards['roth-ira'];
    if (card) setActiveCalibration(card);
  }

  if (!currentStory) return null;

  return (
    <div className="story-shell relative w-full max-w-[960px] h-full mx-auto flex flex-col bg-[#171827] shadow-2xl overflow-hidden">
      <header className="shrink-0 px-4 pt-3 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <button onClick={onNavigateBack} className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/5 text-white/80 border border-white/10" aria-label="Back to case selection"><X className="w-4 h-4" /></button>
          <div className="flex items-center gap-2">
            <button onClick={() => handleCalibrationOpen('withdrawal-rate')} className="flex items-center gap-1.5 min-h-11 px-3 rounded-xl text-xs font-semibold bg-white/5 text-slate-200 border border-white/10"><Lightbulb className="w-4 h-4 text-[#91a5ff]" />Terms</button>
            <button onClick={() => setIsVoiceNarrating((value) => !value)} aria-pressed={isVoiceNarrating} className="flex items-center gap-1.5 min-h-11 px-3 rounded-xl text-xs font-semibold bg-white/5 text-slate-200 border border-white/10">{isVoiceNarrating ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}{isVoiceNarrating ? 'Voice On' : 'Voice Off'}</button>
          </div>
        </div>
        <nav aria-label="Story steps" className="flex gap-1 sm:gap-2 mt-2">
          {stories.map((story, index) => (
            <button key={story.id} onClick={() => { setCurrentIndex(index); setProgress(0); }} aria-label={`Step ${index + 1} of ${stories.length}: ${story.title}`} aria-current={index === currentIndex ? 'step' : undefined} className="group flex-1 min-w-0 min-h-11 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-white rounded">
              <span className="block h-1 rounded-full bg-white/20 overflow-hidden"><span className="block h-full bg-white transition-all duration-75" style={{ width: `${index < currentIndex ? 100 : index === currentIndex ? progress : 0}%` }} /></span>
              <span className={`hidden sm:block truncate mt-1 text-xs ${index === currentIndex ? 'text-white font-semibold' : 'text-slate-400'}`}>{story.title}</span>
            </button>
          ))}
        </nav>
      </header>
      <main className="relative flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentStory.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.22 }} className="w-full h-full">
            <StoryCard card={currentStory} isActive={!modalOpen && !isAssistantActive && !hidden} pillars={pillars} viewingStyle={viewingStyle} onCalibrationOpen={handleCalibrationOpen} onInspectGrounding={setActiveGrounding} onSelectStyle={(style) => { setViewingStyle(style); useAppStore.getState().setViewingStyle(style); }} onActionComplete={onComplete} stepChecklist={checklistState} onToggleStep={(i) => setChecklistState((prev) => prev.map((value, index) => index === i ? !value : value))} />
          </motion.div>
        </AnimatePresence>
      </main>
      <footer className="relative z-40 shrink-0 px-4 pb-3 pt-2 sm:px-6 bg-[#171827] border-t border-white/10">
        <div className="flex justify-center mb-2"><VoicePushButton onOverlayChange={setVoicePanelOpen} caseId={caseId} voiceState={voice.voiceState} transcript={voice.transcript} responseMessage={voice.responseMessage} guardRedirect={voice.guardRedirect} detectedTerm={voice.detectedTerm} showSuggestions={voice.showSuggestions} onPressStart={voice.startListening} onPressEnd={voice.stopListening} onStopSpeaking={voice.stopSpeaking} onSelectSuggestion={(q) => voice.pushToAsk(q)} onOpenCalibration={handleCalibrationOpen} onClosePopup={() => { voice.setShowSuggestions(false); voice.clearGuardRedirect(); voice.clearResponseMessage(); voice.stopSpeaking(); }} /></div>
        <div className="flex items-center justify-between gap-2">
          <button onClick={goToPrev} disabled={currentIndex === 0} className="min-h-11 px-4 rounded-xl border border-white/15 text-white disabled:opacity-40">Previous</button>
          <button onClick={() => setPlaying((value) => !value)} aria-pressed={playing} className="min-h-11 px-4 rounded-xl border border-white/15 text-white">{playing ? 'Pause' : 'Play'}</button>
          <button onClick={goToNext} className="min-h-11 px-4 rounded-xl bg-[#4565d6] text-white font-semibold">{currentIndex === stories.length - 1 ? 'Finish' : 'Next'}</button>
        </div>
      </footer>
      <AnimatePresence>{activeCalibration && <CalibrationMicroCard card={activeCalibration} onDismiss={() => setActiveCalibration(null)} onInspectGrounding={setActiveGrounding} />}</AnimatePresence>
      <GroundingInspector grounding={activeGrounding} onClose={() => setActiveGrounding(null)} />
    </div>
  );
}
