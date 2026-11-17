import test from 'node:test';
import assert from 'node:assert/strict';
import { useAppStore } from '../src/stores/appStore';
import { TELEMETRY_SESSION_STORAGE_KEY } from '../src/lib/telemetry';

test('restores telemetry for the same case after a simulated page reload', () => {
  const values = new Map<string, string>();
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    },
  });

  try {
    useAppStore.getState().reset();
    useAppStore.getState().setCase('timothy-melanie-weah');
    useAppStore.getState().trackTermConsulted('Roth IRA');
    assert.ok(values.has(TELEMETRY_SESSION_STORAGE_KEY));

    useAppStore.setState({ currentCase: null, telemetryEvents: [] });
    useAppStore.getState().setCase('timothy-melanie-weah');

    assert.equal(useAppStore.getState().telemetryEvents.length, 1);
    assert.equal(useAppStore.getState().getTelemetrySummary().termConsultations.uniqueTerms[0], 'Roth IRA');
  } finally {
    useAppStore.getState().reset();
    if (originalDescriptor) Object.defineProperty(globalThis, 'sessionStorage', originalDescriptor);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
