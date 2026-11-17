import assert from 'node:assert/strict';
import { nextStory, previousStory, shouldAdvancePlayback } from '../src/lib/storyPlayback.ts';

assert.deepEqual(previousStory(0), { index: 0, complete: false });
assert.deepEqual(previousStory(2), { index: 1, complete: false });
assert.deepEqual(nextStory(0, 3), { index: 1, complete: false });
assert.deepEqual(nextStory(2, 3), { index: 2, complete: true });
assert.deepEqual(nextStory(0, 0), { index: 0, complete: false });
assert.equal(shouldAdvancePlayback(true, false, false, false), true);
assert.equal(shouldAdvancePlayback(false, false, false, false), false);
assert.equal(shouldAdvancePlayback(true, true, false, false), false);
assert.equal(shouldAdvancePlayback(true, false, true, false), false);
assert.equal(shouldAdvancePlayback(true, false, false, true), false);
console.log('Story playback verified');

// A transport suggestion that has no visible panel must not disable navigation.
import { voiceBlocksPlayback } from '../src/lib/storyPlayback.ts';
const backgroundVoice = { isListening: false, isSpeaking: false, showSuggestions: true, responseMessage: null, guardRedirect: null };
assert.equal(voiceBlocksPlayback(backgroundVoice, false), false);
assert.equal(voiceBlocksPlayback(backgroundVoice, true), true);
assert.equal(voiceBlocksPlayback({ ...backgroundVoice, isListening: true }, false), true);
