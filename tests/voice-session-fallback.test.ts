import test from 'node:test';
import assert from 'node:assert/strict';
import { getOfflineAnswer, GUARDRAIL_REDIRECT_MESSAGE } from '../src/lib/voice/offlineAnswer.ts';
import { caseBrief } from '../server/caseBrief.ts';

test('voice fallback: speculative terms trigger immediate guardrail redirect', () => {
  const cases = ['timothy-melanie-weah', 'daniel-emily-johnson', 'michael-carter', 'samantha-lewis'];
  const speculativeQueries = [
    'Should I buy Bitcoin?',
    'What about Ethereum crypto?',
    'Should I pick Nvidia stock?',
    'Can I day trade meme stocks?',
  ];

  for (const c of cases) {
    for (const q of speculativeQueries) {
      const res = getOfflineAnswer(c, q);
      assert.equal(res.isGuardrail, true);
      assert.equal(res.text, GUARDRAIL_REDIRECT_MESSAGE);
      assert.equal(res.detectedTerm, null);
    }
  }
});

test('voice fallback: household-specific answers contain strictly grounded figures', () => {
  // Timothy & Melanie Weah: 18% debt
  const weahDebt = getOfflineAnswer('timothy-melanie-weah', 'Why pay off the 18% Chase card first?');
  assert.equal(weahDebt.detectedTerm, 'revolving-apr');
  assert.match(weahDebt.text, /\$6,800/);
  assert.match(weahDebt.text, /18%/);
  assert.match(weahDebt.text, /60 to 62/);

  // Timothy & Melanie Weah: Life insurance
  const weahLife = getOfflineAnswer('timothy-melanie-weah', 'Why add life insurance?');
  assert.equal(weahLife.detectedTerm, 'mortality-ratio');
  assert.match(weahLife.text, /\$235,000/);
  assert.match(weahLife.text, /\$485,000/);

  // Daniel & Emily Johnson: Life insurance
  const johnsonLife = getOfflineAnswer('daniel-emily-johnson', 'Why increase our life insurance coverage?');
  assert.equal(johnsonLife.detectedTerm, 'mortality-ratio');
  assert.match(johnsonLife.text, /\$1,166,000/);
  assert.match(johnsonLife.text, /52 to 57/);

  // Michael Carter: $550k home in Austin
  const carterHome = getOfflineAnswer('michael-carter', 'Can I afford to buy a $550,000 home in 2027?');
  assert.match(carterHome.text, /\$550,000/);
  assert.match(carterHome.text, /Austin/);
  assert.match(carterHome.text, /2027/);

  // Michael Carter: 58 vs 60 retirement
  const carterRetire = getOfflineAnswer('michael-carter', 'What is the impact of retiring at 58 vs 60?');
  assert.equal(carterRetire.detectedTerm, 'withdrawal-rate');
  assert.match(carterRetire.text, /58 vs 60/);
  assert.match(carterRetire.text, /\$10,300\/year/);
  assert.match(carterRetire.text, /26 to 62/);

  // Samantha Lewis: Second home 2030
  const samanthaHome = getOfflineAnswer('samantha-lewis', 'Can I buy a second home in 2030?');
  assert.match(samanthaHome.text, /\$500,000/);
  assert.match(samanthaHome.text, /2030/);
});

test('voice fallback: term detection maps answers to calibration keys', () => {
  const termsToTest: [string, string, string][] = [
    ['timothy-melanie-weah', 'Tell me about our Roth IRA accounts', 'roth-ira'],
    ['timothy-melanie-weah', 'What is our safe withdrawal rate?', 'withdrawal-rate'],
    ['timothy-melanie-weah', 'Should we use leveraged ETF UPRO?', 'leveraged-etf'],
    ['daniel-emily-johnson', 'What is umbrella liability insurance?', 'umbrella-liability'],
    ['daniel-emily-johnson', 'How does the 529 college plan work for Oliver & Sophia?', '529-plan'],
  ];

  for (const [caseId, query, expectedTerm] of termsToTest) {
    const res = getOfflineAnswer(caseId, query);
    assert.equal(res.detectedTerm, expectedTerm);
  }
});

test('vite relay plugin: generates complete case briefs with verified numbers', () => {
  const cases = ['timothy-melanie-weah', 'daniel-emily-johnson', 'michael-carter', 'samantha-lewis'];
  for (const id of cases) {
    const brief = caseBrief(id);
    assert.ok(brief.length > 200, `Brief for ${id} should be non-empty`);
    assert.match(brief, /=== HOUSEHOLD ===/);
    assert.match(brief, /=== FINANCIAL HEALTH ===/);
    assert.match(brief, /=== TOP MOVES ===/);
  }
});
