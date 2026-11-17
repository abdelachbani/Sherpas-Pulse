/**
 * src/pages/StoriesPage.tsx
 *
 * Full mobile stories experience ("Financial Wrapped"):
 *  - 6 vertical swipeable story cards with 100% responsive bounds
 *  - Native, non-overlapping bottom action dock integrated into StoryContainer
 *  - Automatic voice term detection triggering micro-calibration
 *  - Live voice transcript bubble, sample question pills, and Boomerang Guardrail
 */

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractStoryData, extractCalibrationCards } from '../lib/mcp/extractor';
import { StoryContainer } from '../components/stories/StoryContainer';
import { useVoiceSession } from '../lib/voice/useVoiceSession';

export default function StoriesPage() {
  const { caseId } = useParams<{ caseId: string }>();
  if (!CASES.some((item) => item.id === caseId)) {
    return <main className="session-page p-8 text-white"><h1>Household not found</h1><p className="mt-4">Choose a household to start a session.</p><a href="/" className="mt-6 inline-flex items-center text-indigo-300 underline">Choose a household</a></main>;
  }
  return <StoriesContent key={caseId} />;
}

function StoriesContent() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  const activeCase = CASES.find((c) => c.id === caseId)!;

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  // Voice session for Push-to-Ask & Zero-Prompt Assistant
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
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col justify-between">
      <StoryContainer
        key={activeCase.id}
        caseId={activeCase.id}
        stories={stories}
        calibrationCards={calibrationCards}
        pillars={activeCase.financialHealth.score.pillars}
        voice={voice}
        onComplete={handleComplete}
        onNavigateBack={() => navigate('/')}
      />
    </div>
  );
}
