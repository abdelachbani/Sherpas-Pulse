import assert from 'node:assert/strict';
import { formatStoryValue } from '../src/lib/storyFormatting';

assert.equal(formatStoryValue('2027-01-01T00:00:00.000Z'), 'January 2027');
assert.equal(formatStoryValue('2027-12-31T23:00:00.000Z'), 'December 2027');
assert.equal(formatStoryValue('not a date'), 'not a date');
assert.equal(formatStoryValue('2027-99-01T00:00:00.000Z'), '2027-99-01T00:00:00.000Z');
assert.equal(formatStoryValue(2027), '2027');
