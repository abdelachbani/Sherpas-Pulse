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

export function buildStoryFrames(stories: StoryCard[], style: ViewingStyle): StoryFrame[] {
  return stories.flatMap((story, chapterIndex) => {
    if (style === 'express') {
      const first = story.dataPoints[0];
      const usePoint = story.highlightNumber == null && first && String(first.value).length <= 120;
      const useLabel = story.highlightNumber == null && first && !usePoint;
      const id = `${story.id}-frame-1`;
      return [{
        id, chapterId: story.id, chapterIndex, partIndex: 0, partCount: 1,
        card: { ...story, id, dataPoints: usePoint ? [first] : [],
          highlightNumber: useLabel ? first.label : story.highlightNumber,
          highlightLabel: useLabel ? 'First listed detail' : story.highlightLabel,
          highlightUnit: useLabel ? undefined : story.highlightUnit },
      }];
    }
    const points = story.dataPoints.flatMap(splitPoint);
    const groups: DataPoint[][] = [];
    for (const point of points) {
      const last = groups[groups.length - 1];
      const canPair = style === 'visual' && last?.length === 1 && String(last[0].value).length <= 45 && String(point.value).length <= 45;
      if (canPair) last.push(point); else groups.push([point]);
    }
    // The headline gets its own frame, leaving room for the sourced details.
    const hasHighlight = story.highlightNumber != null;
    const pages: Array<{ points: DataPoint[]; highlight: boolean }> = groups.map(group => ({ points: group, highlight: false }));
    if (hasHighlight) {
      const highlightPage = { points: [], highlight: true };
      if (style === 'analytical') pages.push(highlightPage); else pages.unshift(highlightPage);
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
