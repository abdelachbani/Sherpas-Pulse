import test from 'node:test';
import assert from 'node:assert/strict';
import { typedQuestionMessages } from '../src/lib/voice/typedQuestion.ts';

test('typed questions become a user message followed by a response request', () => {
  assert.deepEqual(typedQuestionMessages('  What is my goal?  '), [
    { type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'What is my goal?' }] } },
    { type: 'response.create' },
  ]);
  assert.deepEqual(typedQuestionMessages('  '), []);
});

test('keeps the previous question available as context after a relay reconnect', () => {
  const [message] = typedQuestionMessages('And when can we buy it?', 'How much does the car cost?');
  assert.match(message?.item?.content?.[0]?.text ?? '', /Previous question.*How much does the car cost/);
  assert.match(message?.item?.content?.[0]?.text ?? '', /Current question: And when can we buy it\?/);
});
