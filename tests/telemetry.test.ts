import assert from 'node:assert/strict';
import { useAppStore } from '../src/stores/appStore';
import { estimateComprehensionIndex, hasReachedHesitationThreshold } from '../src/lib/telemetry';

useAppStore.getState().reset();
useAppStore.getState().trackTermConsulted('Roth IRA');
useAppStore.getState().trackTermConsulted('roth ira');

assert.equal(useAppStore.getState().getTelemetrySummary().termConsultations.uniqueTermCount, 1);
assert.equal(useAppStore.getState().shouldSuggestCalibration(), false);

useAppStore.getState().trackTermConsulted('Umbrella Liability');
useAppStore.getState().trackTermConsulted('529');
useAppStore.getState().trackTradeoffChange({ action: 'choice_select' });
useAppStore.getState().trackAllocationChange({ action: 'reorder' });
useAppStore.getState().trackVoiceAsk({ inputMode: 'voice' });
useAppStore.getState().setLanguageMode('simple');
useAppStore.getState().setLanguageMode('simple');

const summary = useAppStore.getState().getTelemetrySummary();
assert.equal(summary.shouldSuggestCalibration, true);
assert.equal(summary.calibrationReason, 'term_consultations');
assert.equal(summary.termConsultations.uniqueTermCount, 3);
assert.deepEqual(summary.interactions, {
  tradeoffChanges: 1,
  allocationChanges: 1,
  voiceAsks: 1,
  languageModeChanges: 1,
});
assert.equal(useAppStore.getState().languageMode, 'simple');
assert.equal(useAppStore.getState().telemetryEvents.at(-1)?.type, 'language_mode_change');

useAppStore.getState().reset();
assert.equal(useAppStore.getState().languageMode, 'standard');

assert.equal(hasReachedHesitationThreshold(3999), false);
assert.equal(hasReachedHesitationThreshold(4000), true);

assert.equal(estimateComprehensionIndex({
  uniqueTermCount: 2,
  hesitationPauses: 1,
  tradeoffChanges: 1,
  allocationChanges: 1,
}), 70);
assert.equal(estimateComprehensionIndex({
  uniqueTermCount: 0,
  hesitationPauses: 0,
  tradeoffChanges: 0,
  allocationChanges: 0,
}), null);

useAppStore.getState().trackHesitationPause({
  frameId: 'health-frame-1',
  chapterId: 'health',
  chapterTitle: 'Financial health',
  chapterIndex: 0,
  partIndex: 0,
  inactiveMs: 4000,
}, 'health');
useAppStore.getState().trackHesitationPause({
  frameId: 'health-frame-1',
  chapterId: 'health',
  chapterTitle: 'Financial health',
  chapterIndex: 0,
  partIndex: 0,
  inactiveMs: 5000,
}, 'health');
assert.equal(useAppStore.getState().getTelemetrySummary().hesitationPauses, 1);
assert.equal(useAppStore.getState().getTelemetrySummary().calibrationReason, 'hesitation_pause');
assert.equal(useAppStore.getState().shouldSuggestCalibration(), true);
useAppStore.getState().reset();
