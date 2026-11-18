import type { DataPoint, StoryCard as StoryCardData, ViewingStyle } from '../../types';
import { formatStoryValue } from '../../lib/storyFormatting';
import { FinancialText } from '../shared/FinancialText';
import { StoryScore, StoryTimeline } from './StoryDataViz';
import './stories.css';

interface Props {
  card: StoryCardData;
  viewingStyle: ViewingStyle;
  revealProgress: number;
}

const chapterLabels = ['Your financial plan', 'Overview', 'Goals', 'Advice', 'Milestones', 'Next steps'];

function pointLabel(point: DataPoint) {
  return point.label.replace(/_/g, ' ');
}

function displayValue(value: string | number, unit?: string, precision: 'month' | 'day' = 'month') {
  const formatted = formatStoryValue(value, precision);
  return unit ? `${formatted} ${unit}` : formatted;
}

function ExpressTakeaway({ card }: { card: StoryCardData }) {
  const point = card.dataPoints[0];
  const value = card.highlightNumber ?? point?.value;
  if (value == null) return null;

  const label = card.highlightNumber != null ? card.highlightLabel : point.label;
  const unit = card.highlightNumber != null ? card.highlightUnit : point.unit;
  return (
    <section className="story-express-takeaway" aria-label="Chapter takeaway" data-numeric={typeof value === 'number' || undefined}>
      {label && <p className="story-express-label"><FinancialText text={label.replace(/_/g, ' ')} /></p>}
      <p className="story-express-value"><FinancialText text={displayValue(value, unit)} /></p>
    </section>
  );
}

function AnalyticalDetails({ points }: { points: DataPoint[] }) {
  return (
    <dl className="story-analytical-details" aria-label="Detailed figures">
      {points.map((point, index) => (
        <div key={`${point.label}-${index}`} data-long={String(point.value).length > 64 || undefined}>
          <dt><FinancialText text={pointLabel(point)} /></dt>
          <dd><FinancialText text={displayValue(point.value, point.unit, 'day')} /></dd>
        </div>
      ))}
    </dl>
  );
}

function VisualDetails({ card, points, revealProgress }: { card: StoryCardData; points: DataPoint[]; revealProgress: number }) {
  const visibleCount = revealProgress >= .64 ? 4 : revealProgress >= .44 ? 3 : revealProgress >= .22 ? 2 : 1;
  const datedYears = card.pillar === 'living-map'
    ? [...new Set(points.slice(0, visibleCount).flatMap(({ value }) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) ? [Number(value.slice(0, 4))] : []))]
    : [];

  return (
    <>
      {points.length > 0 && <section aria-label="Case details" className="story-details">
        {points.map((point, index) => {
          const score = typeof point.value === 'number' && point.unit === '/100' ? point.value : null;
          return <div key={`${point.label}-${index}`} className="story-detail" data-revealed={index < visibleCount} aria-hidden={index >= visibleCount || undefined}>
            <p className="text-sm font-medium text-slate-500"><FinancialText text={pointLabel(point)} /></p>
            <p className="mt-1 break-words text-base leading-snug text-[#172033]"><FinancialText text={displayValue(point.value, point.unit)} /></p>
            {score != null && <StoryScore value={score} label={pointLabel(point)} />}
          </div>;
        })}
      </section>}
      <StoryTimeline years={datedYears} />
    </>
  );
}

export function StoryCard({ card, viewingStyle, revealProgress }: Props) {
  const points = card.dataPoints.filter((point) => !(card.highlightUnit === '/100' && point.label === 'Health score' && point.value === card.highlightNumber));
  const visual = viewingStyle === 'visual';

  return (
    <article data-viewing-style={viewingStyle} className="story-card flex h-full min-h-0 flex-col overflow-hidden bg-[#f7f8fa] px-5 text-[#172033] sm:px-8">
      <div className="story-composition mx-auto w-full">
        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4565d6]">{chapterLabels[card.storyIndex] ?? 'Your plan'}</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]"><FinancialText text={card.title} /></h1>
          <p className="mt-2 text-sm leading-snug text-slate-600 sm:text-base"><FinancialText text={card.subtitle} /></p>
        </header>
        <div key={card.id} className={visual ? `story-reveal story-reveal--${card.pillar}` : 'story-mode-content'}>
          {viewingStyle === 'express' ? <ExpressTakeaway card={card} /> : (
            <>
              {card.highlightNumber != null && <section aria-label={card.highlightLabel || 'Plan highlight'} className="story-highlight">
                {card.highlightLabel && <p className="text-sm font-medium text-[#4565d6]"><FinancialText text={card.highlightLabel} /></p>}
                <p className="mt-1 break-words text-2xl font-semibold leading-tight sm:text-3xl"><FinancialText text={displayValue(card.highlightNumber, card.highlightUnit)} /></p>
                {card.tagline && <p className="mt-2 text-sm text-slate-600"><FinancialText text={card.tagline} /></p>}
                {visual && card.highlightUnit === '/100' && typeof card.highlightNumber === 'number' && <StoryScore value={card.highlightNumber} label="Financial health score" />}
              </section>}
              {visual ? <VisualDetails card={card} points={points} revealProgress={revealProgress} /> : points.length > 0 && <AnalyticalDetails points={points} />}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
