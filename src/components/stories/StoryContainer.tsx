/**
 * src/components/stories/StoryContainer.tsx
 *
 * Full-screen Instagram / Spotify Wrapped story swiper:
 *  - 6 segments progress bar with 25s auto-advance
 *  - Independent Story Canvas touch tap/hold navigation (left=prev, right=next, hold=pause)
 *  - Dedicated Bottom Action Bar with Prev, Ask Sherpas Voice, and Next controls (never overlaps content)
 *  - Integrated VoiceAssistantModal for Push-to-Ask, speech recognition, and instant questions
 *  - Micro-calibration bottom sheet overlay & Grounding Inspector modal
 *  - Pauses automatically when voice is listening/speaking or calibration is open
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  X,
  ChevronLeft,
  ChevronRight,
  Mic,
  Lightbulb,
} from 'lucide-react';
import type {
  StoryCard as StoryCardType,
  CalibrationCard,
  GroundingRef,
  ViewingStyle,
  PillarScore,
} from '../../types';
import type { VoiceSessionResult } from '../../lib/voice/useVoiceSession';
import { StoryCard } from './StoryCard';
import { CalibrationMicroCard } from '../calibration/CalibrationMicroCard';
import { GroundingInspector } from '../calibration/GroundingInspector';
import { VoiceAssistantModal } from '../voice/VoiceAssistantModal';

interface Props {
  caseId: string;
  stories: StoryCardType[];
  calibrationCards: Record<string, CalibrationCard>;
  pillars?: PillarScore[];
  voice: VoiceSessionResult;
  onComplete: () => void;
  onNavigateBack: () => void;
}

const STORY_DURATION_MS = 25000; // 25 seconds per story

export function StoryContainer({
  caseId,
  stories,
  calibrationCards,
  pillars = [],
  voice,
  onComplete,
  onNavigateBack,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0); // 0 to 100 for current story
  const [isPaused, setIsPaused] = useState(false);
  const [viewingStyle, setViewingStyle] = useState<ViewingStyle>('visual');
  const [activeCalibration, setActiveCalibration] = useState<CalibrationCard | null>(null);
  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);
  const [isVoiceNarrating, setIsVoiceNarrating] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [checklistState, setChecklistState] = useState([false, false, false]);

  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const currentStory = stories[currentIndex] ?? stories[0];

  // If voice detects a financial term, automatically open its calibration card!
  useEffect(() => {
    if (voice.detectedTerm) {
      const card = calibrationCards[voice.detectedTerm];
      if (card) {
        setActiveCalibration(card);
        setIsPaused(true);
      }
      voice.clearDetectedTerm();
    }
  }, [voice.detectedTerm, calibrationCards, voice]);

  // ── Background gradients per story ──────────────────────────────────────────
  const gradients = [
    'from-slate-950 via-slate-900 to-indigo-950', // 0: Vibe Check
    'from-slate-950 via-slate-900 to-teal-950',   // 1: Overview Superpower/Leak
    'from-slate-950 via-indigo-950 to-slate-900', // 2: Real-Life Translator
    'from-slate-950 via-slate-900 to-sky-950',    // 3: Advice Liquidity Tank
    'from-slate-950 via-purple-950 to-slate-900', // 4: Living Map Time Machine
    'from-slate-950 via-emerald-950 to-slate-900',// 5: Action 5-Min Win
  ];
  const bgGradient = gradients[currentIndex] || gradients[0];

  // ── Voice narration using Web Speech API fallback ───────────────────────────
  const speakCurrentStory = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!isVoiceNarrating) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [isVoiceNarrating]);

  useEffect(() => {
    if (!isVoiceModalOpen && !voice.isListening && !voice.isSpeaking && isVoiceNarrating && currentStory?.voiceScript) {
      speakCurrentStory(currentStory.voiceScript);
    } else if (!isVoiceNarrating && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [currentIndex, isVoiceNarrating, isVoiceModalOpen, voice.isListening, voice.isSpeaking, currentStory?.voiceScript, speakCurrentStory]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onComplete();
    }
  }, [currentIndex, stories.length, onComplete]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // ── 25-Second Progress Timer ────────────────────────────────────────────────
  const effectivelyPaused =
    isPaused ||
    isVoiceModalOpen ||
    voice.isListening ||
    voice.isSpeaking ||
    !!activeCalibration ||
    !!activeGrounding;

  useEffect(() => {
    if (effectivelyPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const intervalMs = 50;
    const step = (intervalMs / STORY_DURATION_MS) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          goToNext();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [effectivelyPaused, goToNext]);

  // ── Story Canvas Tap / Hold Handlers ─────────────────────────────────────────
  function handleCanvasPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // If target is an interactive button or link, do not trigger canvas tap
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }

    isHoldingRef.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsPaused(true);
    }, 250);
  }

  function handleCanvasPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('a')) {
      return;
    }

    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    setIsPaused(false);

    if (!isHoldingRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const isLeftSide = x < rect.width * 0.35;

      if (isLeftSide) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    isHoldingRef.current = false;
  }

  function handleCalibrationOpen(termKey: string) {
    const card = calibrationCards[termKey] ?? calibrationCards['roth-ira'];
    if (card) {
      setActiveCalibration(card);
      setIsPaused(true);
    }
  }

  return (
    <div
      className={`relative w-full max-w-[420px] h-dvh mx-auto flex flex-col justify-between overflow-hidden bg-gradient-to-b ${bgGradient} transition-colors duration-700 select-none shadow-2xl`}
    >
      {/* ── Top Progress Segments (Instagram-style) ─────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-30 pt-2 px-3 flex gap-1 pointer-events-none">
        {stories.map((s, idx) => {
          let segFill = 0;
          if (idx < currentIndex) segFill = 100;
          else if (idx === currentIndex) segFill = progress;

          return (
            <div
              key={s.id}
              className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm"
            >
              <div
                className="h-full bg-white rounded-full transition-all duration-75"
                style={{ width: `${segFill}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* ── Top Floating Action Bar ─────────────────────────────────────────── */}
      <div className="absolute top-4 inset-x-0 z-30 px-3 flex items-center justify-between pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateBack();
          }}
          className="p-1.5 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-md border border-white/10 cursor-pointer"
          aria-label="Back to case selection"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {/* Quick calibration helper button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCalibrationOpen('revolving-apr');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md hover:bg-amber-500/30 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            <span>Calibrate</span>
          </button>

          {/* Voice Narrator Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVoiceNarrating((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold backdrop-blur-md border transition-all cursor-pointer ${
              isVoiceNarrating
                ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40 shadow-lg shadow-emerald-500/20'
                : 'bg-black/40 text-slate-300 border-white/10'
            }`}
          >
            {isVoiceNarrating ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Voice On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <span>Voice Off</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Active Story Canvas (Flex-1, Safe Bounds, Touch-friendly) ───────── */}
      <div
        className="relative flex-1 min-h-0 w-full overflow-hidden"
        onPointerDown={handleCanvasPointerDown}
        onPointerUp={handleCanvasPointerUp}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            <StoryCard
              card={currentStory}
              isActive={!effectivelyPaused}
              pillars={pillars}
              viewingStyle={viewingStyle}
              onCalibrationOpen={handleCalibrationOpen}
              onInspectGrounding={(ref) => {
                setActiveGrounding(ref);
                setIsPaused(true);
              }}
              onSelectStyle={(s) => setViewingStyle(s)}
              onActionComplete={onComplete}
              stepChecklist={checklistState}
              onToggleStep={(i) => {
                setChecklistState((prev) => {
                  const copy = [...prev];
                  copy[i] = !copy[i];
                  return copy;
                });
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Dedicated Bottom Action Bar (Shrink-0, Never Overlaps Content) ───── */}
      <div className="shrink-0 h-14 border-t border-white/10 bg-slate-950/85 backdrop-blur-md px-3 flex items-center justify-between z-30">
        {/* Previous Story */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrev();
          }}
          disabled={currentIndex === 0}
          className={`p-2 rounded-full border transition-all ${
            currentIndex === 0
              ? 'opacity-20 border-transparent text-slate-600 cursor-not-allowed'
              : 'bg-white/10 text-white hover:bg-white/20 border-white/10 cursor-pointer active:scale-95'
          }`}
          aria-label="Previous story"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Central Push-to-Ask / Voice Assistant Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVoiceModalOpen(true);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-xl transition-all active:scale-95 cursor-pointer ${
            voice.voiceState === 'listening'
              ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-500/20 animate-pulse'
              : voice.voiceState === 'speaking'
              ? 'bg-indigo-600 text-white shadow-indigo-600/30 animate-pulse'
              : 'bg-gradient-to-r from-indigo-600 to-sky-600 hover:opacity-95 text-white shadow-indigo-600/25'
          }`}
          aria-label="Ask Sherpas Voice Assistant"
        >
          <Mic className="w-3.5 h-3.5 text-white" />
          <span>
            {voice.voiceState === 'listening'
              ? 'Listening...'
              : voice.voiceState === 'speaking'
              ? 'Speaking...'
              : 'Ask Sherpas 🎙️'}
          </span>
        </button>

        {/* Next Story / Finish */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-all cursor-pointer active:scale-95"
          aria-label="Next story"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Voice Assistant Modal / Bottom Sheet ─────────────────────────────── */}
      <VoiceAssistantModal
        isOpen={isVoiceModalOpen}
        caseId={caseId}
        voiceState={voice.voiceState}
        transcript={voice.transcript}
        responseMessage={voice.responseMessage}
        guardRedirect={voice.guardRedirect}
        detectedTerm={voice.detectedTerm}
        errorNotice={voice.errorNotice}
        onStartListening={voice.startListening}
        onStopListening={voice.stopListening}
        onAskQuestion={voice.pushToAsk}
        onStopSpeaking={voice.stopSpeaking}
        onOpenCalibration={(termKey) => handleCalibrationOpen(termKey)}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      {/* ── Implicit Calibration Micro-Card Overlay ─────────────────────────── */}
      <AnimatePresence>
        {activeCalibration && (
          <CalibrationMicroCard
            card={activeCalibration}
            onDismiss={() => {
              setActiveCalibration(null);
              setIsPaused(false);
            }}
            onInspectGrounding={(ref) => setActiveGrounding(ref)}
          />
        )}
      </AnimatePresence>

      {/* ── Grounding Inspector Modal ───────────────────────────────────────── */}
      <GroundingInspector
        grounding={activeGrounding}
        onClose={() => {
          setActiveGrounding(null);
          setIsPaused(false);
        }}
      />
    </div>
  );
}
