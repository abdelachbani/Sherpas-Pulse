/**
 * src/pages/StoriesPage.tsx
 *
 * Full mobile stories experience ("Financial Wrapped"):
 *  - 6 vertical swipeable story cards
 *  - Deterministic data extraction from current case
 *  - Push-to-Ask voice interruption integration
 *  - Smooth routing to Couple Allocation or Single Trade-off
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractStoryData, extractCalibrationCards } from '../lib/mcp/extractor';
import { StoryContainer } from '../components/stories/StoryContainer';
import { VoicePushButton } from '../components/shared/VoicePushButton';
import { useVoiceSession } from '../lib/voice/useVoiceSession';

export default function StoriesPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  // Fallback to lookup from CASES if store is empty on direct reload
  const activeCase = currentCase ?? CASES.find((c) => c.id === caseId) ?? CASES[0];

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  // Voice session for Push-to-Ask
  const voice = useVoiceSession(activeCase.id);

  const stories = extractStoryData(
    activeCase.financialHealth,
    activeCase.investmentAnalysis,
  );

  const calibrationCards = extractCalibrationCards(
    activeCase.financialHealth,
    activeCase.investmentAnalysis,
  );

  function handleComplete() {
    addTelemetryEvent({
      type: 'story_complete',
      payload: { caseId: activeCase.id, householdType: activeCase.householdType },
      timestamp: Date.now(),
      storyId: 'story-action',
    });

    if (activeCase.householdType === 'couple') {
      navigate(`/case/${activeCase.id}/allocate`);
    } else {
      navigate(`/case/${activeCase.id}/tradeoff`);
    }
  }

  return (
    <div className="relative w-full h-dvh bg-slate-950 overflow-hidden">
      <StoryContainer
        stories={stories}
        calibrationCards={calibrationCards}
        pillars={activeCase.financialHealth.score.pillars}
        onComplete={handleComplete}
        onNavigateBack={() => navigate('/')}
      />

      {/* Floating Push-to-Ask Mic Button */}
      <div className="pointer-events-auto">
        <VoicePushButton
          voiceState={voice.voiceState}
          transcript={voice.transcript}
          onPressStart={voice.startListening}
          onPressEnd={voice.stopListening}
        />
      </div>
    </div>
  );
}
