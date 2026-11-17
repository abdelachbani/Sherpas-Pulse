import test from 'node:test';
import assert from 'node:assert/strict';
import { supportsSplitView } from '../src/lib/layout';
test('split view is reserved for desktop widths, including after a resize', () => {
  for (const width of [320,390,768,1023]) assert.equal(supportsSplitView(width), false);
  for (const width of [1024,1440,1920]) assert.equal(supportsSplitView(width), true);
});
