import test from 'node:test';
import assert from 'node:assert/strict';
import { loadChecklist, saveChecklist } from '../src/lib/sessionChecklist';

function storage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

test('checklist persists per case and ignores invalid indexes', () => {
  const store = storage();
  saveChecklist(store, 'a', [0, 2]);
  assert.deepEqual(loadChecklist(store, 'a', 2), [0]);
  assert.deepEqual(loadChecklist(store, 'b', 3), []);
  store.setItem('sherpas-action-checklist:a', 'broken');
  assert.deepEqual(loadChecklist(store, 'a', 3), []);
});

test('storage errors do not crash reading and are reported on saving', () => {
  const store = { getItem: () => { throw Error('denied'); }, setItem: () => { throw Error('denied'); } };
  assert.deepEqual(loadChecklist(store, 'a', 2), []);
  assert.equal(saveChecklist(store, 'a', [0]), false);
});
