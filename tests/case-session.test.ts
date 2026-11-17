import test from 'node:test';
import assert from 'node:assert/strict';
import { useAppStore } from '../src/stores/appStore';

test('switching household clears the prior client session without clearing the selected case', () => {
  const store = useAppStore.getState();
  store.reset();
  store.setCase('timothy-melanie-weah');
  store.setPartner('secondary');
  store.setViewingStyle('express');
  store.addTelemetryEvent({ type: 'voice_ask', payload: {}, timestamp: 1 });
  store.setAllocation('primary', { partner: 'Timothy', allocations: [] });
  store.setCase('michael-carter');
  const state = useAppStore.getState();
  assert.equal(state.currentCase?.id, 'michael-carter');
  assert.equal(state.partner, null);
  assert.equal(state.viewingStyle, null);
  assert.equal(state.telemetryEvents.length, 0);
  assert.equal(state.coupleAllocations.primary, null);
});

test('setting the same household retains the session', () => {
  const store = useAppStore.getState();
  store.setCase('michael-carter');
  store.setViewingStyle('analytical');
  store.setCase('michael-carter');
  assert.equal(useAppStore.getState().viewingStyle, 'analytical');
});
