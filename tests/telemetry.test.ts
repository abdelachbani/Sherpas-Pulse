import assert from 'node:assert/strict';
import { useAppStore } from '../src/stores/appStore';

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

const summary = useAppStore.getState().getTelemetrySummary();
assert.equal(summary.shouldSuggestCalibration, true);
assert.equal(summary.termConsultations.uniqueTermCount, 3);
assert.deepEqual(summary.interactions, {
  tradeoffChanges: 1,
  allocationChanges: 1,
  voiceAsks: 1,
});

useAppStore.getState().reset();
