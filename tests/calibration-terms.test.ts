import test from 'node:test';
import assert from 'node:assert/strict';
import { CASES } from '../src/lib/mcp/cases';
import { extractCalibrationCards } from '../src/lib/mcp/extractor';
import {
  getRelevantTermsForCase,
  getDefaultTermForChapter,
  HOUSEHOLD_TERMS,
} from '../src/lib/calibrationTerms';

test('every case has tailored relevant terms matching its actual circumstances', () => {
  for (const item of CASES) {
    const cards = extractCalibrationCards(item.financialHealth, item.investmentAnalysis);
    const relevant = getRelevantTermsForCase(item.id, cards);
    assert(relevant.length >= 4, `${item.id} should have at least 4 relevant terms`);

    // Michael Carter has no dependents, so 529-plan should not be in his relevant terms
    if (item.id === 'michael-carter') {
      assert(!relevant.some((c) => c.termKey === '529-plan'), 'Michael Carter should not have 529 plan');
      assert(relevant.some((c) => c.termKey === 'withdrawal-rate'), 'Michael Carter should have withdrawal rate');
    }

    // Samantha Lewis is debt-free, so revolving-apr should not be in her relevant terms
    if (item.id === 'samantha-lewis') {
      assert(!relevant.some((c) => c.termKey === 'revolving-apr'), 'Samantha Lewis should not have revolving APR');
      assert(relevant.some((c) => c.termKey === '529-plan'), 'Samantha Lewis should have 529 plan for teens');
    }

    // Timothy & Melanie Weah have high-interest card debt and young kids
    if (item.id === 'timothy-melanie-weah') {
      assert(relevant.some((c) => c.termKey === 'revolving-apr'), 'Weahs should have revolving APR');
      assert(relevant.some((c) => c.termKey === '529-plan'), 'Weahs should have 529 plan');
    }

    // Daniel & Emily Johnson have zero life insurance coverage score (0/20)
    if (item.id === 'daniel-emily-johnson') {
      assert(relevant.some((c) => c.termKey === 'mortality-ratio'), 'Johnsons should have mortality ratio');
      assert(relevant.some((c) => c.termKey === '529-plan'), 'Johnsons should have 529 plan');
    }
  }
});

test('chapter default term maps to story context and exists in calibration cards', () => {
  for (const item of CASES) {
    const cards = extractCalibrationCards(item.financialHealth, item.investmentAnalysis);
    for (let chapter = 0; chapter < 6; chapter++) {
      const termKey = getDefaultTermForChapter(item.id, chapter, cards);
      assert(cards[termKey], `${item.id} chapter ${chapter} produced invalid term ${termKey}`);
    }
  }
});

test('unknown cases fall back gracefully', () => {
  const cards = extractCalibrationCards(CASES[0].financialHealth, CASES[0].investmentAnalysis);
  const relevant = getRelevantTermsForCase('unknown-household', cards);
  assert.equal(relevant.length, Object.keys(cards).length);
  const term = getDefaultTermForChapter('unknown-household', 0, cards);
  assert(cards[term]);
});
