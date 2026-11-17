import assert from 'node:assert/strict';
import { buildStoryFrames } from '../src/lib/storyFrames';
import { CASES } from '../src/lib/mcp/cases';
import { extractStoryData } from '../src/lib/mcp/extractor';

for (const item of CASES) {
  const stories = extractStoryData(item.financialHealth, item.investmentAnalysis);
  for (const style of ['visual', 'analytical'] as const) {
    const frames = buildStoryFrames(stories, style);
    assert.equal(new Set(frames.map(frame => frame.id)).size, frames.length);
    for (const story of stories) {
      const chapter = frames.filter(frame => frame.chapterId === story.id);
      assert(chapter.length > 0);
      assert(chapter.every((frame, index) => frame.partIndex === index && frame.partCount === chapter.length));
      for (const point of story.dataPoints) {
        const fragments = chapter.flatMap(frame => frame.card.dataPoints).filter(part => part.label === point.label && part.grounding?.jsonPath === point.grounding?.jsonPath);
        assert.equal(fragments.map(part => String(part.value)).join(' '), String(point.value));
        assert(fragments.every(part => part.grounding === point.grounding));
      }
    }
    assert(frames.every(frame => frame.card.dataPoints.length <= (style === 'visual' ? 2 : 1)));
  }
  const express = buildStoryFrames(stories, 'express');
  assert.equal(express.length, stories.length);
  assert(express.length < buildStoryFrames(stories, 'analytical').length);
  express.forEach((frame, index) => {
    const source = stories[index];
    assert.equal(frame.chapterId, source.id);
    if (frame.card.highlightNumber != null) {
      assert([source.highlightNumber, ...source.dataPoints.map(point => point.label)].includes(frame.card.highlightNumber));
    }
    for (const point of frame.card.dataPoints) assert(source.dataPoints.includes(point));
  });
}
console.log('Story frames preserve case details in full modes and summarize in express');
