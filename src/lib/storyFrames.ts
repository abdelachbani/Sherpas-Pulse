import type { DataPoint, StoryCard, ViewingStyle } from '../types';

export interface StoryFrame {
  id: string;
  chapterId: string;
  chapterIndex: number;
  partIndex: number;
  partCount: number;
  card: StoryCard;
}

// Split on word boundaries so dates, currency values and source references stay intact.
function splitPoint(point: DataPoint): DataPoint[] {
  if (typeof point.value !== 'string' || point.value.length <= 120) return [point];
  const words = point.value.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?|\$[\d,.]+(?:\s+(?:million|billion|thousand))?|\S+/gi) ?? [];
  const chunks: string[] = [];
  let chunk = '';
  for (const word of words) {
    if (chunk && (`${chunk} ${word}`.length > 120 || (chunk.length >= 70 && /[.!?]$/.test(chunk)))) {
      chunks.push(chunk);
      chunk = word;
    } else chunk = chunk ? `${chunk} ${word}` : word;
  }
  if (chunk) chunks.push(chunk);
  return chunks.map(value => ({ ...point, value }));
}

function isDatedPoint(point: DataPoint) {
  return typeof point.value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(point.value);
}

export function buildStoryFrames(stories: StoryCard[], style: ViewingStyle): StoryFrame[] {
  return stories.flatMap((story, chapterIndex) => {
    if (style === 'express') {
      const first = story.dataPoints[0];
      const point = story.highlightNumber == null && first ? splitPoint(first)[0] : undefined;
      const scripts: Record<StoryCard['pillar'], string> = {
        vibe: 'Welcome to your financial plan. We will pause after each chapter for your questions.',
        overview: `Your financial health score is ${story.highlightNumber} out of 100.`,
        translator: 'Here is one goal recorded in your plan.',
        advice: 'Here is one move to discuss with your advisor.',
        'living-map': 'Here is one milestone recorded in your plan.',
        action: 'Start your next conversation with your advisor here.',
      };
      const id = `${story.id}-frame-1`;
      return [{
        id, chapterId: story.id, chapterIndex, partIndex: 0, partCount: 1,
        card: { ...story, id, dataPoints: point ? [point] : [], voiceScript: scripts[story.pillar] },
      }];
    }

    const points = story.dataPoints.flatMap(splitPoint);
    const groups: DataPoint[][] = [];
    for (const point of points) {
      const last = groups[groups.length - 1];
      const size = (item: DataPoint) => item.label.length + String(item.value).length;
      const sameScale = typeof point.value === 'number' && last?.every(item => typeof item.value === 'number' && item.unit === point.unit);
      const sameTimeline = isDatedPoint(point) && last?.every(isDatedPoint);
      const shortTextPair = last?.length === 1 && size(last[0]) + size(point) <= 110;
      if (last && (style === 'analytical' ? last.length < 3 : ((last.length < 4 && (sameScale || sameTimeline)) || shortTextPair))) {
        last.push(point);
      } else {
        groups.push([point]);
      }
    }
    const pages: Array<{ points: DataPoint[]; highlight: boolean }> = groups.map(group => ({ points: group, highlight: false }));
    if (story.highlightNumber != null) {
      // A short first detail can share the headline; longer details get their own space.
      const first = pages[0];
      if (first && ((first.points.length === 1 && String(first.points[0].value).length <= 45) || (first.points[0].label === 'Health score' && first.points[0].value === story.highlightNumber)) && String(story.highlightNumber).length <= 35) first.highlight = true;
      else pages.unshift({ points: [], highlight: true });
    }
    if (!pages.length) pages.push({ points: [], highlight: false });
    return pages.map((page, partIndex) => {
      const id = `${story.id}-frame-${partIndex + 1}`;
      return {
        id, chapterId: story.id, chapterIndex, partIndex, partCount: pages.length,
        card: { ...story, id, dataPoints: page.points,
          highlightNumber: page.highlight ? story.highlightNumber : undefined,
          highlightLabel: page.highlight ? story.highlightLabel : undefined,
          highlightUnit: page.highlight ? story.highlightUnit : undefined,
          tagline: page.highlight ? story.tagline : undefined },
      };
    });
  });
}
