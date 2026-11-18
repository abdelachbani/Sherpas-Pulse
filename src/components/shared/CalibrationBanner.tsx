import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';

export function CalibrationBanner() {
  const calibrationReason = useAppStore((state) => state.getTelemetrySummary().calibrationReason);
  const languageMode = useAppStore((state) => state.languageMode);
  const setLanguageMode = useAppStore((state) => state.setLanguageMode);
  const hasDisabledSimple = useAppStore((state) => state.telemetryEvents.some(
    (event) => event.type === 'language_mode_change' && event.payload.languageMode === 'standard',
  ));
  const [dismissed, setDismissed] = useState(false);
  const simple = languageMode === 'simple';

  if (!simple && (!calibrationReason || dismissed || hasDisabledSimple)) return null;

  return (
    <aside className="calibration-banner mt-1 flex flex-wrap items-center justify-between gap-x-2 rounded-lg border border-indigo-400/40 bg-slate-900 px-2.5 text-white">
      <p role="status" className="py-1.5 text-sm font-semibold">
        {simple ? 'Simplified language is on' : 'Want simpler language?'}
      </p>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setLanguageMode(simple ? 'standard' : 'simple')}
          className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-indigo-200 hover:bg-white/10"
        >
          {simple ? 'Use standard language' : 'Simplify'}
        </button>
        {!simple && (
          <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss language suggestion" className="min-h-11 rounded-lg px-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white">
            Not now
          </button>
        )}
      </div>
    </aside>
  );
}
