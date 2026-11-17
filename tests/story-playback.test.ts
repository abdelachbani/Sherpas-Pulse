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

import { canNarrateStory, storyTapDirection } from '../src/lib/storyPlayback.ts';
assert.equal(canNarrateStory(undefined, 1000), true);
assert.equal(canNarrateStory(1000, 1000 + 599_999), false);
assert.equal(canNarrateStory(1000, 1000 + 600_000), true);
assert.equal(canNarrateStory(2000, 1000), false);
assert.equal(storyTapDirection(20, 20, 25, 23, 200), 'previous');
assert.equal(storyTapDirection(180, 20, 180, 20, 200), 'next');
assert.equal(storyTapDirection(20, 20, 34, 20, 200), null);

import { advanceBeat, beatDuration } from '../src/lib/storyPlayback.ts';
assert.deepEqual(advanceBeat(0, 2, false), { partIndex: 1, checkpoint: false });
assert.deepEqual(advanceBeat(1, 2, false), { partIndex: 1, checkpoint: true });
assert.deepEqual(advanceBeat(1, 2, true), { partIndex: 1, checkpoint: true });
assert.equal(beatDuration('A short thought'), 3000);
assert.equal(beatDuration('word '.repeat(200)), 8000);

import { nextChapterFrame } from '../src/lib/storyPlayback.ts';
const chapters = [{ chapterId: 'a' }, { chapterId: 'a' }, { chapterId: 'b' }];
assert.deepEqual(nextChapterFrame(1, chapters), { index: 2, complete: false });
assert.deepEqual(nextChapterFrame(2, chapters), { index: 2, complete: true });

import { chapterProgress } from '../src/lib/storyPlayback.ts';
assert.equal(chapterProgress([3000, 5000], 0, 0, false), 0);
assert.equal(chapterProgress([3000, 5000], 0, 1500, false), 1500 / 8000);
assert.equal(chapterProgress([3000, 5000], 1, 1000, false), 4000 / 8000);
assert.equal(chapterProgress([3000, 5000], 1, 5000, true), 1);
import { advanceElapsed } from '../src/lib/storyPlayback.ts';
assert.equal(advanceElapsed(1000, 500, true, 3000), 1000);
assert.equal(advanceElapsed(1000, 500, false, 3000), 1500);
assert.equal(advanceElapsed(2900, 500, false, 3000), 3000);
