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

test('reload restores only that household’s priorities and reset clears its local review', () => {
  const storage = new Map<string, string>();
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } });
  const first = 'timothy-melanie-weah';
  const allocation = { partner: 'Melanie', allocations: [{ strategyId: 'card-payoff', label: 'Pay down revolving card', amount: 11200, priority: 1 }] };
  const store = useAppStore.getState();
  try {
    store.reset();
    store.setCase(first);
    store.setPartner('secondary');
    store.setAllocation('secondary', allocation);
    storage.set(`sherpas-action-checklist:${first}`, '[0]');
    store.setCase('daniel-emily-johnson');
    assert.equal(useAppStore.getState().coupleAllocations.secondary, null);
    store.setCase(first);
    assert.deepEqual(useAppStore.getState().coupleAllocations.secondary, allocation);
    assert.equal(useAppStore.getState().partner, 'secondary');
    store.reset();
    assert.equal(storage.has(`sherpas-action-checklist:${first}`), false);
    store.setCase(first);
    assert.equal(useAppStore.getState().coupleAllocations.secondary, null);
  } finally {
    store.reset();
    if (oldStorage) Object.defineProperty(globalThis, 'sessionStorage', oldStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
