import assert from 'node:assert/strict';
import { getOfflineAnswer, GUARDRAIL_REDIRECT_MESSAGE } from '../src/lib/voice/offlineAnswer.ts';

// 1. Guardrail tests
const cryptoAnswer = getOfflineAnswer('timothy-melanie-weah', 'Should I invest in Bitcoin or crypto?');
assert.equal(cryptoAnswer.isGuardrail, true);
assert.equal(cryptoAnswer.text, GUARDRAIL_REDIRECT_MESSAGE);

const stocksAnswer = getOfflineAnswer('daniel-emily-johnson', 'Should we buy Nvidia or day trade stocks?');
assert.equal(stocksAnswer.isGuardrail, true);
assert.equal(stocksAnswer.text, GUARDRAIL_REDIRECT_MESSAGE);

// 2. Household specific queries
// Timothy & Melanie Weah: 18% credit card
const weahCard = getOfflineAnswer('timothy-melanie-weah', 'Why pay off the 18% Chase card first?');
assert.equal(weahCard.isGuardrail, false);
assert.equal(weahCard.detectedTerm, 'revolving-apr');
assert.match(weahCard.text, /6,800/);
assert.match(weahCard.text, /18%/);
assert.match(weahCard.text, /60 to 62/);

// Timothy & Melanie Weah: Umbrella liability
const weahUmbrella = getOfflineAnswer('timothy-melanie-weah', 'What is umbrella liability insurance?');
assert.equal(weahUmbrella.detectedTerm, 'umbrella-liability');
assert.match(weahUmbrella.text, /umbrella/i);

// Timothy & Melanie Weah: 529 plan
const weah529 = getOfflineAnswer('timothy-melanie-weah', 'How does the 529 college plan work?');
assert.equal(weah529.detectedTerm, '529-plan');
assert.match(weah529.text, /45,000/);

// Daniel & Emily Johnson: Life insurance
const johnsonLife = getOfflineAnswer('daniel-emily-johnson', 'Why increase our life insurance coverage?');
assert.equal(johnsonLife.detectedTerm, 'mortality-ratio');
assert.match(johnsonLife.text, /1,166,000/);
assert.match(johnsonLife.text, /52 to 57/);

// Michael Carter: $550k home
const carterHome = getOfflineAnswer('michael-carter', 'Can I afford to buy a $550,000 home in 2027?');
assert.match(carterHome.text, /550,000/);
assert.match(carterHome.text, /affordability/);

// Michael Carter: Retiring at 58 vs 60
const carterRetire = getOfflineAnswer('michael-carter', 'What is the impact of retiring at 58 vs 60?');
assert.match(carterRetire.text, /age 58/);
assert.match(carterRetire.text, /does not provide a comparison/);

// Samantha Lewis: College tuition
const samanthaCollege = getOfflineAnswer('samantha-lewis', 'How do I fund college tuition starting this year?');
assert.match(samanthaCollege.text, /50,000/);

// Samantha Lewis: Second home 2030
const samanthaHome = getOfflineAnswer('samantha-lewis', 'Can I buy a second home in 2030?');
assert.match(samanthaHome.text, /500,000/);
assert.match(samanthaHome.text, /2030/);

// General question fallback with verified data
const generalAnswer = getOfflineAnswer('timothy-melanie-weah', 'Can you summarize our top recommendation?');
assert.equal(generalAnswer.isGuardrail, false);
assert.match(generalAnswer.text, /Timothy & Melanie/);
assert.match(generalAnswer.text, /60\/100/);
assert.match(generalAnswer.text, /Pay down revolving card/);

console.log('All offline answer tests passed successfully.');
