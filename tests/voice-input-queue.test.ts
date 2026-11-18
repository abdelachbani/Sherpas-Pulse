import test from 'node:test';
import assert from 'node:assert/strict';
import { createInputQueue } from '../src/lib/voice/inputQueue.ts';

test('flushes pre-open audio in order before the caller commits', () => {
  const queue = createInputQueue();
  const messages: unknown[] = [];
  queue.append('first'); queue.append('second');
  queue.flush((message) => messages.push(message));
  messages.push({ type: 'input_audio_buffer.commit' });
  assert.deepEqual(messages, [
    { type: 'input_audio_buffer.append', audio: 'first' },
    { type: 'input_audio_buffer.append', audio: 'second' },
    { type: 'input_audio_buffer.commit' },
  ]);
});

test('discard prevents old audio from reaching a new turn', () => {
  const queue = createInputQueue();
  const messages: unknown[] = [];
  queue.append('old'); queue.clear(); queue.flush((m) => messages.push(m));
  assert.deepEqual(messages, []);
});
