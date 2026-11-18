import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { test } from 'node:test';
import clips from '../src/lib/sherpiNarrationClips.json';
import { CASES } from '../src/lib/mcp/cases';
import { extractStoryData } from '../src/lib/mcp/extractor';
import { buildStoryFrames } from '../src/lib/storyFrames';
import { SHERPI_INTRO_STEPS } from '../src/lib/sherpiIntro';

test('all four demo households and viewing modes have bundled narration', () => {
  const assets: Readonly<Record<string, string>> = clips;
  const lines = new Set<string>(SHERPI_INTRO_STEPS.map(step => `${step.title}. ${step.text}`));
  for (const plan of CASES) {
    const stories = extractStoryData(plan.financialHealth, plan.investmentAnalysis);
    for (const mode of ['visual', 'analytical', 'express'] as const) {
      for (const { card } of buildStoryFrames(stories, mode)) {
        if (card.voiceScript) lines.add(card.voiceScript);
      }
    }
  }
  for (const line of lines) {
    assert.ok(assets[line], `Missing narration for "${line}"`);
    assert.ok(statSync(`public/sherpi-narration/${assets[line]}`).size > 0);
  }
});
