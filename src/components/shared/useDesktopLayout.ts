import { useEffect, useState } from 'react';
import { DESKTOP_BREAKPOINT, supportsSplitView } from '../../lib/layout';
export function useDesktopLayout() {
  const [desktop, setDesktop] = useState(() => typeof window !== 'undefined' && supportsSplitView(window.innerWidth));
  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`);
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return desktop;
}
