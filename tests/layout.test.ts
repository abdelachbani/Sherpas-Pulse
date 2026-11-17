import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DESKTOP_BREAKPOINT,
  TABLET_BREAKPOINT,
  isDesktopViewport,
  isTabletViewport,
  isMobileViewport,
  supportsSplitView,
} from '../src/lib/layout';

test('responsive breakpoints cleanly partition mobile, tablet, and desktop viewports', () => {
  assert.equal(DESKTOP_BREAKPOINT, 1024);
  assert.equal(TABLET_BREAKPOINT, 768);

  for (const width of [320, 390, 430, 767]) {
    assert.equal(isMobileViewport(width), true, `width ${width} should be mobile`);
    assert.equal(isTabletViewport(width), false, `width ${width} should not be tablet`);
    assert.equal(isDesktopViewport(width), false, `width ${width} should not be desktop`);
  }

  for (const width of [768, 844, 1023]) {
    assert.equal(isMobileViewport(width), false, `width ${width} should not be mobile`);
    assert.equal(isTabletViewport(width), true, `width ${width} should be tablet`);
    assert.equal(isDesktopViewport(width), false, `width ${width} should not be desktop`);
  }

  for (const width of [1024, 1440, 1920]) {
    assert.equal(isMobileViewport(width), false, `width ${width} should not be mobile`);
    assert.equal(isTabletViewport(width), false, `width ${width} should not be tablet`);
    assert.equal(isDesktopViewport(width), true, `width ${width} should be desktop`);
  }
});

test('split view is decommissioned across all viewports in favor of clean responsive layout', () => {
  for (const width of [320, 390, 430, 768, 844, 1023, 1024, 1440, 1920]) {
    assert.equal(supportsSplitView(width), false, `width ${width} must not enable split view`);
  }
});
