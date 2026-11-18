import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getOfflineAnswer } from '../src/lib/voice/offlineAnswer';

test('answers a precise balance question without adding the recommendation', () => {
  const { text } = getOfflineAnswer('timothy-melanie-weah', 'What is the current card balance?');
  assert.match(text, /18,000/);
  assert.doesNotMatch(text, /6,800|60 to 62/);
  assert.match(text, /\?$/);
});

test('answers just the score for each active household', () => {
  const scores = {
    'timothy-melanie-weah': 60,
    'daniel-emily-johnson': 52,
    'michael-carter': 26,
    'samantha-lewis': 82,
  };
  for (const [id, score] of Object.entries(scores)) {
    const { text } = getOfflineAnswer(id, 'What is my financial health score?');
    assert.ok(text.includes(`${score}/100`), id);
    assert.doesNotMatch(text, /first listed move|recommendation is/i);
    assert.match(text, /\?$/);
  }
});

test('declines questions about other households and unsupported questions', () => {
  const other = getOfflineAnswer('timothy-melanie-weah', 'What is Samantha Lewis’s financial health score?');
  assert.match(other.text, /only.*open plan/i);
  assert.doesNotMatch(other.text, /\d/);
  const unknown = getOfflineAnswer('michael-carter', 'How much will my car cost to service next year?');
  assert.match(unknown.text, /plan does not provide/i);
  assert.match(unknown.text, /\?$/);
});

test('does not mistake a different household’s name for part of the open plan', () => {
  for (const [id, question] of [
    ['daniel-emily-johnson', 'Compare me with Michael Carter.'],
    ['samantha-lewis', 'What does Melanie Weah pay?'],
    ['michael-carter', 'Tell me about the daniel-emily-johnson plan.'],
  ]) {
    const answer = getOfflineAnswer(id, question);
    assert.equal(answer.isGuardrail, true);
    assert.match(answer.text, /only.*open plan/i);
  }
});
