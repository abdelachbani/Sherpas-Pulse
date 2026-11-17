import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

export function CalibrationBanner() {
  const shouldSuggestCalibration = useAppStore((state) => state.shouldSuggestCalibration());
  const setViewingStyle = useAppStore((state) => state.setViewingStyle);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    if (!shouldSuggestCalibration) setActivated(false);
  }, [shouldSuggestCalibration]);

  if (!shouldSuggestCalibration || activated) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-[420px] items-center gap-3 rounded-2xl border border-blue-400/30 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl"
    >
      <Sparkles className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Want a simpler view?</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          You have looked up three or more financial terms. Switch to a shorter, less technical summary.
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          setViewingStyle('express');
          setActivated(true);
        }}
        className="min-h-11 shrink-0 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      >
        Simplify
      </button>
    </aside>
  );
}
