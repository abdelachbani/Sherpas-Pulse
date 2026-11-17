import type { StoryCard as StoryCardType, GroundingRef, ViewingStyle, PillarScore } from '../../types';
import { formatStoryValue } from '../../lib/storyFormatting';
import { FinancialText } from '../shared/FinancialText';
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
}

const chapterLabels = ['Welcome', 'Overview', 'Goals', 'Advice', 'Milestones', 'Next steps'];

export function StoryCard({ card, viewingStyle }: Props) {
  const title = card.interactiveType === 'vibe_check' ? 'Your plan at a glance' : card.title;
  const subtitle = card.interactiveType === 'vibe_check'
    ? `${viewingStyle === 'analytical' ? 'Analytical' : viewingStyle === 'express' ? 'Express' : 'Visual'} review · Your plan, one step at a time.`
    : card.subtitle;
  return (
    <article className="story-card flex min-h-0 flex-1 flex-col overflow-hidden bg-[#f7f8fa] px-5 text-[#172033] sm:px-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4 sm:gap-6 sm:py-6">
        <header>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#4565d6]">{chapterLabels[card.storyIndex] ?? 'Your plan'}</p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-[28px]" style={{ fontFamily: 'Poppins, sans-serif' }}><FinancialText text={title} /></h1>
          <p className="mt-2 text-sm leading-snug text-slate-600 sm:text-base"><FinancialText text={subtitle} /></p>
        </header>
        <div key={card.id} className={`story-reveal story-reveal--${card.pillar}`}>
        {card.highlightNumber != null && <section aria-label={card.highlightLabel || 'Plan highlight'} className="story-highlight">
          {card.highlightLabel && <p className="text-sm font-medium text-[#4565d6]"><FinancialText text={card.highlightLabel} /></p>}
          <p className="mt-1 break-words text-2xl font-semibold leading-tight sm:text-3xl" style={{ fontFamily: 'Poppins, sans-serif' }}><FinancialText text={`${formatStoryValue(card.highlightNumber)}${card.highlightUnit ? ` ${card.highlightUnit}` : ''}`} /></p>
          {card.tagline && <p className="mt-2 text-sm text-slate-600"><FinancialText text={card.tagline} /></p>}
          {card.highlightUnit === '/100' && typeof card.highlightNumber === 'number' && <div className="story-meter" aria-hidden="true"><div className="story-meter-fill" style={{ width: `${Math.max(0, Math.min(100, card.highlightNumber))}%` }} /></div>}
        </section>}
        {card.dataPoints.length > 0 && <section aria-label="Case details" className="story-details">
          {card.dataPoints.map((point, index) => {
            const value = `${formatStoryValue(point.value)}${point.unit ? ` ${point.unit}` : ''}`;
            const score = typeof point.value === 'number' && point.unit === '/100' ? point.value : null;
            return <div key={`${point.label}-${index}`} className="story-detail">
              <p className="text-sm font-medium text-slate-500"><FinancialText text={point.label.replace(/_/g, ' ')} /></p>
              <p className="mt-1 break-words text-base leading-snug text-[#172033]"><FinancialText text={value} /></p>
              {viewingStyle === 'visual' && score != null && <div className="story-meter" aria-hidden="true"><div className="story-meter-fill" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>}
            </div>;
          })}
        </section>}
        </div>
      </div>
    </article>
  );
}
