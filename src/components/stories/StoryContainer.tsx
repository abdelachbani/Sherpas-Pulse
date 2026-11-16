/**
 * src/components/stories/StoryContainer.tsx
 *
 * Full-screen Instagram / Spotify Wrapped story swiper:
 *  - 6 segments progress bar with 25s auto-advance
 *  - Left-tap (previous), right-tap (next), hold-to-pause (touch/mouse)
 *  - Micro-calibration bottom sheet overlay
 *  - Grounding Inspector modal
 *  - Voice speech narration toggle
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type {
  StoryCard as StoryCardType,
  CalibrationCard,
  GroundingRef,
  ViewingStyle,
  PillarScore,
} from '../../types';
import { StoryCard } from './StoryCard';
import { CalibrationMicroCard } from '../calibration/CalibrationMicroCard';
import { GroundingInspector } from '../calibration/GroundingInspector';

interface Props {
  stories: StoryCardType[];
  calibrationCards: Record<string, CalibrationCard>;
  pillars?: PillarScore[];
  onComplete: () => void;
  onNavigateBack: () => void;
}

const STORY_DURATION_MS = 25000; // 25 seconds per story

export function StoryContainer({
  stories,
  calibrationCards,
  pillars = [],
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
  const [checklistState, setChecklistState] = useState([false, false, false]);

  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef(false);

  const currentStory = stories[currentIndex] ?? stories[0];

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
    if (isVoiceNarrating && currentStory?.voiceScript) {
      speakCurrentStory(currentStory.voiceScript);
    } else if (!isVoiceNarrating && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [currentIndex, isVoiceNarrating, currentStory?.voiceScript, speakCurrentStory]);

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
  const effectivelyPaused = isPaused || !!activeCalibration || !!activeGrounding;

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

  // ── Touch & Click Handlers ──────────────────────────────────────────────────
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    isHoldingRef.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsPaused(true);
    }, 250);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    setIsPaused(false);

    if (!isHoldingRef.current) {
      // Tap detected! Determine left or right side
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
      className={`relative w-full max-w-[420px] h-dvh mx-auto flex flex-col justify-between overflow-hidden bg-gradient-to-b ${bgGradient} transition-colors duration-700 select-none`}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* ── Top Progress Segments (Instagram-style) ─────────────────────────── */}
      <div className="absolute top-0 inset-x-0 z-30 pt-3 px-4 flex gap-1.5 pointer-events-none">
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
      <div className="absolute top-6 inset-x-0 z-30 px-4 flex items-center justify-between pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigateBack();
          }}
          className="p-2 rounded-full bg-black/40 text-white/80 hover:text-white backdrop-blur-md border border-white/10"
          aria-label="Back to case selection"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          {/* Voice Narrator Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsVoiceNarrating((prev) => !prev);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all ${
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

      {/* ── Active Story Card ───────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStory.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
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
