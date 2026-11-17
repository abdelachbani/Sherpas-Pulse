import { ChevronRight, ShieldCheck } from 'lucide-react';
import type { StoryCard as StoryCardType, GroundingRef, ViewingStyle, PillarScore, DataPoint } from '../../types';
import { PillarBars } from './StoryDataViz';
import { formatStoryValue } from '../../lib/storyFormatting';

interface Props {
  card: StoryCardType;
  isActive: boolean;
  pillars?: PillarScore[];
  viewingStyle: ViewingStyle | null;
  onCalibrationOpen: (term: string) => void;
  onInspectGrounding: (ref: GroundingRef) => void;
  onSelectStyle?: (style: ViewingStyle) => void;
  onActionComplete?: () => void;
  stepChecklist?: boolean[];
  onToggleStep?: (idx: number) => void;
}

export function StoryCard({ card, pillars = [], viewingStyle, onInspectGrounding, onSelectStyle, onActionComplete }: Props) {
  const scorePoint = card.dataPoints.find((point) => /health score/i.test(point.label));
  const parsedScore = scorePoint ? Number(String(scorePoint.value).replace(/\s*\/\s*100\s*$/, '')) : NaN;
  const hasScore = Number.isFinite(parsedScore) && parsedScore >= 0 && parsedScore <= 100;
  const highlightIsScore = hasScore && Number(card.highlightNumber) === parsedScore;
  const points = card.dataPoints.filter((point) => point !== scorePoint || !hasScore);

  function groundingButton(ref: GroundingRef, label: string) {
    return <button type="button" onClick={(event) => { event.stopPropagation(); onInspectGrounding(ref); }} className="inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-[#b9c7ff] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#819cff]" aria-label={`Inspect source for ${label}`}><ShieldCheck className="h-4 w-4" aria-hidden="true" /> <span>View source</span></button>;
  }

  function dataPoint(point: DataPoint, index: number) {
    return <div key={`${point.label}-${index}`} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 py-4 last:border-0">
      <div className="min-w-0"><p className="text-sm text-slate-300">{point.label}</p><p className="mt-1 text-base leading-relaxed text-white">{formatStoryValue(point.value)}{point.unit ? ` ${point.unit}` : ''}</p></div>
      {point.grounding && groundingButton(point.grounding, point.label)}
    </div>;
  }

  return (
    <article className="story-card relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-8 text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6 py-5">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-[#b9c7ff]"><span className="capitalize">{card.pillar.replace('-', ' ')} · {card.storyIndex + 1} / 6</span>{card.grounding && groundingButton(card.grounding, card.title)}</div>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{card.title}</h1>
          <p className="text-base leading-relaxed text-slate-300">{card.subtitle}</p>
        </header>

        {card.highlightNumber != null && !highlightIsScore && <div className="rounded-2xl bg-[#eef1ff] p-6 text-[#161827]">
          {card.highlightLabel && <p className="text-sm font-medium text-[#4565d6]">{card.highlightLabel}</p>}
          <p className="mt-1 break-words text-3xl font-semibold leading-tight sm:text-4xl" style={{ fontFamily: 'Poppins, sans-serif' }}>{formatStoryValue(card.highlightNumber)}{card.highlightUnit ? ` ${card.highlightUnit}` : ''}</p>
          {card.tagline && <p className="mt-3 text-sm leading-relaxed text-slate-600">{card.tagline}</p>}
        </div>}

        {card.interactiveType === 'vibe_check' && <fieldset className="space-y-3"><legend className="mb-3 text-base font-semibold">Choose your viewing style</legend>{([
          ['visual', 'Visual · Key figures and charts'], ['analytical', 'Analytical · All plan details'], ['express', 'Express · Summary first'],
        ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={viewingStyle === value} onClick={(event) => { event.stopPropagation(); onSelectStyle?.(value); }} className={`w-full rounded-xl border px-4 py-3 text-left text-base font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#819cff] ${viewingStyle === value ? 'border-[#819cff] bg-[#4565d6] text-white' : 'border-white/15 bg-white/5 text-slate-200 hover:border-[#819cff]'}`}>{label}</button>)}</fieldset>}

        {hasScore && <div className="space-y-2"><div className="flex items-center gap-5 rounded-2xl bg-[#eef1ff] p-6 text-[#161827]">
          <div className="relative h-28 w-28 shrink-0"><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="50" cy="50" r="43" fill="none" stroke="#d8dffb" strokeWidth="8" /><circle cx="50" cy="50" r="43" fill="none" stroke="#4565d6" strokeWidth="8" strokeLinecap="round" strokeDasharray={2 * Math.PI * 43} strokeDashoffset={2 * Math.PI * 43 * (1 - parsedScore / 100)} /></svg><span className="absolute inset-0 flex items-center justify-center text-3xl font-semibold">{parsedScore}</span></div>
          <div><p className="text-sm font-medium text-[#4565d6]">Health score / 100</p>{card.highlightLabel && <p className="mt-1 text-xl font-semibold">{card.highlightLabel}</p>}</div>
        </div>{scorePoint?.grounding && groundingButton(scorePoint.grounding, scorePoint.label)}</div>}
        {points.length > 0 && !(hasScore && viewingStyle === 'visual') && <section aria-label="Case details" className={card.interactiveType === 'time_machine' ? 'border-l-2 border-[#819cff] pl-5' : card.interactiveType === 'vibe_check' ? 'grid grid-cols-2 gap-x-5 rounded-2xl border border-white/10 bg-white/5 px-5' : 'rounded-2xl border border-white/10 bg-white/5 px-5'}>{(viewingStyle === 'express' ? points.slice(0, 2) : points).map(dataPoint)}{viewingStyle === 'express' && points.length > 2 && <details className="py-4"><summary className="min-h-11 cursor-pointer text-sm font-medium text-indigo-200">See all {points.length} plan details</summary>{points.slice(2).map(dataPoint)}</details>}</section>}
        {card.interactiveType === 'superpower_vs_leak' && viewingStyle === 'visual' && pillars.length > 0 && <PillarBars pillars={pillars} />}
        {card.interactiveType === 'wrapped_summary' && <button type="button" onClick={(event) => { event.stopPropagation(); onActionComplete?.(); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4565d6] px-5 py-4 text-base font-semibold text-white hover:bg-[#5876e4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#819cff]">Continue to next step <ChevronRight className="h-5 w-5" aria-hidden="true" /></button>}
      </div>
    </article>
  );
}
