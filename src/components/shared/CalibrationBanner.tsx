import { useEffect, useState } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';

interface Props {
  placement?: 'fixed' | 'inline';
}

export function CalibrationBanner({ placement = 'fixed' }: Props) {
  const calibrationReason = useAppStore((state) => state.getTelemetrySummary().calibrationReason);
  const shouldSuggestCalibration = calibrationReason !== null;
  const languageMode = useAppStore((state) => state.languageMode);
  const setLanguageMode = useAppStore((state) => state.setLanguageMode);
  const [dismissed, setDismissed] = useState(false);
  const placementClass = placement === 'inline'
    ? 'my-2 w-full'
    : 'fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-[420px]';

  useEffect(() => {
    if (!shouldSuggestCalibration || languageMode === 'simple') setDismissed(false);
  }, [languageMode, shouldSuggestCalibration]);

  if (languageMode === 'simple') {
    return (
      <aside
        role="status"
        aria-live="polite"
        className={`${placementClass} flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-slate-950/95 p-3 text-white shadow-xl backdrop-blur-xl`}
      >
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Simplified language is on</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">
            Financial terms are now shown in everyday words.
          </p>
        </div>
      </aside>
    );
  }

  if (!shouldSuggestCalibration || dismissed) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className={`${placementClass} flex items-center gap-3 rounded-2xl border border-blue-400/30 bg-slate-950/95 p-4 text-white shadow-2xl backdrop-blur-xl`}
    >
      <Sparkles className="h-5 w-5 shrink-0 text-blue-300" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Want simpler language?</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {calibrationReason === 'term_consultations'
            ? 'You have looked up three or more financial terms. Switch to everyday wording.'
            : 'Taking a moment on this card? Switch to everyday wording.'}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setLanguageMode('simple')}
        className="min-h-11 shrink-0 rounded-xl bg-blue-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
      >
        Simplify
      </button>
      {placement === 'fixed' && (
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss language suggestion"
          className="min-h-11 min-w-11 rounded-xl text-sm text-slate-400 hover:bg-white/10 hover:text-white"
        >
          Not now
        </button>
      )}
    </aside>
  );
}
