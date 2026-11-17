import type { StoryCard as StoryCardType, GroundingRef, ViewingStyle, PillarScore } from '../../types';
import { formatStoryValue } from '../../lib/storyFormatting';
import { FinancialText } from '../shared/FinancialText';
import { StoryScore, StoryTimeline } from './StoryDataViz';
import './stories.css';

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
  partIndex?: number;
  partCount?: number;
  revealProgress: number;
}

const chapterLabels = ['Your financial plan', 'Overview', 'Goals', 'Advice', 'Milestones', 'Next steps'];

export function StoryCard({ card, viewingStyle, revealProgress }: Props) {
  const points = card.dataPoints.filter((point) => !(card.highlightUnit === '/100' && point.label === 'Health score' && point.value === card.highlightNumber));
  const visibleCount = revealProgress >= .64 ? 4 : revealProgress >= .44 ? 3 : revealProgress >= .22 ? 2 : 1;
  const datedYears = card.pillar === 'living-map'
    ? [...new Set(points.slice(0, visibleCount).flatMap(({ value }) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) ? [Number(value.slice(0, 4))] : []))]
    : [];
  return (
    <article className="story-card flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] px-5 text-[#172033] sm:px-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="story-composition mx-auto w-full">
        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4565d6]">{chapterLabels[card.storyIndex] ?? 'Your plan'}</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]" style={{ fontFamily: 'Poppins, sans-serif' }}><FinancialText text={card.title} /></h1>
          <p className="mt-2 text-sm leading-snug text-slate-600 sm:text-base"><FinancialText text={card.subtitle} /></p>
        </header>
        <div key={card.id} className={`story-reveal story-reveal--${card.pillar}`}>
        {card.highlightNumber != null && <section aria-label={card.highlightLabel || 'Plan highlight'} className="story-highlight">
          {card.highlightLabel && <p className="text-sm font-medium text-[#4565d6]"><FinancialText text={card.highlightLabel} /></p>}
          <p className="mt-1 break-words text-2xl font-semibold leading-tight sm:text-3xl" style={{ fontFamily: 'Poppins, sans-serif' }}><FinancialText text={`${formatStoryValue(card.highlightNumber)}${card.highlightUnit ? ` ${card.highlightUnit}` : ''}`} /></p>
          {card.tagline && <p className="mt-2 text-sm text-slate-600"><FinancialText text={card.tagline} /></p>}
          {card.highlightUnit === '/100' && typeof card.highlightNumber === 'number' && <StoryScore value={card.highlightNumber} label={card.highlightLabel || 'Score'} />}
        </section>}
        {points.length > 0 && <section aria-label="Case details" className="story-details">
          {points.map((point, index) => {
            const value = `${formatStoryValue(point.value)}${point.unit ? ` ${point.unit}` : ''}`;
            const score = typeof point.value === 'number' && point.unit === '/100' ? point.value : null;
            return <div key={`${point.label}-${index}`} className="story-detail" data-revealed={index < visibleCount} aria-hidden={index >= visibleCount || undefined}>
              <p className="text-sm font-medium text-slate-500"><FinancialText text={point.label.replace(/_/g, ' ')} /></p>
              <p className="mt-1 break-words text-base leading-snug text-[#172033]"><FinancialText text={value} /></p>
              {viewingStyle === 'visual' && score != null && <StoryScore value={score} label={point.label.replace(/_/g, ' ')} />}
            </div>;
          })}
        </section>}
        {viewingStyle === 'visual' && <StoryTimeline years={datedYears} />}
        </div>
      </div>
    </article>
  );
}
