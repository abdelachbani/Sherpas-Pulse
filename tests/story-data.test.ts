import assert from 'node:assert/strict';
import { CASES } from '../src/lib/mcp/cases';
import { extractStoryData } from '../src/lib/mcp/extractor';

for (const item of CASES) {
  const fh = item.financialHealth;
  const stories = extractStoryData(fh, item.investmentAnalysis);
  assert.equal(stories.length, 6);
  assert.match(JSON.stringify(stories[0]), new RegExp(fh.case.household[0].first_name));
  assert.match(stories[0].voiceScript ?? '', /I’m Sherpi/);
  assert.match(stories[0].voiceScript ?? '', /pause/);
  assert.doesNotMatch(stories[0].voiceScript ?? '', /choose how/i);
  assert(stories[1].dataPoints.some((point) => point.value === fh.score.published_score));
  assert(stories.some((story) => JSON.stringify(story).includes(fh.score.top_moves[0].action)));
  assert(stories.some((story) => story.dataPoints.some((point) => point.value === fh.goals?.goalsSummary?.[0]?.value)));
  if (item.id !== 'timothy-melanie-weah') assert(!JSON.stringify(stories).includes('6,800'));
  for (const story of stories) for (const point of story.dataPoints) {
    if (!point.grounding) continue;
    const found = point.grounding.jsonPath.replace(/\[(\d+)\]/g, '.$1').split('.').reduce<any>((v, key) => v?.[key], fh);
    assert.equal(found, point.grounding.rawValue, `${item.id}: ${point.grounding.jsonPath}`);
  }
  const noAge = structuredClone(fh);
  delete noAge.case.household[0].retirement_age;
  assert(!JSON.stringify(extractStoryData(noAge, item.investmentAnalysis)).includes('Age 62'));
}
console.log('Story data verified for all four cases');
