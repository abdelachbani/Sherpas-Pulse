/**
 * src/pages/StoriesPage.tsx
 *
 * Full mobile stories experience ("Financial Wrapped"):
 *  - 6 vertical swipeable story cards with 100% responsive bounds
 *  - Ergonomically placed Push-to-Ask voice interruption that NEVER blocks content
 *  - Automatic voice term detection triggering micro-calibration
 *  - Graceful speech recognition fallback for all mobile browsers
 */

import { useEffect } from 'react';
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
    <div className="relative w-full h-dvh bg-slate-950 overflow-hidden flex flex-col justify-between">
      <StoryContainer
        stories={stories}
        calibrationCards={calibrationCards}
        pillars={activeCase.financialHealth.score.pillars}
        onComplete={handleComplete}
        onNavigateBack={() => navigate('/')}
        voiceDetectedTerm={voice.detectedTerm}
        onClearVoiceTerm={voice.clearDetectedTerm}
      />

      {/* Ergonomic Non-Intrusive Push-to-Ask Dock (Bottom Center with clean spacing) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <VoicePushButton
          voiceState={voice.voiceState}
          transcript={voice.transcript}
          guardRedirect={voice.guardRedirect}
          onPressStart={voice.startListening}
          onPressEnd={voice.stopListening}
        />
      </div>
    </div>
  );
}
