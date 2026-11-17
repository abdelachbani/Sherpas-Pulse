export const DESKTOP_BREAKPOINT = 1024;
export const TABLET_BREAKPOINT = 768;

export function isDesktopViewport(width: number): boolean {
  return width >= DESKTOP_BREAKPOINT;
}

export function isTabletViewport(width: number): boolean {
  return width >= TABLET_BREAKPOINT && width < DESKTOP_BREAKPOINT;
}

export function isMobileViewport(width: number): boolean {
  return width < TABLET_BREAKPOINT;
}

/**
 * @deprecated Split-screen layout has been removed in favor of standard responsive views.
 */
export function supportsSplitView(_width: number): boolean {
  return false;
}
