import assert from 'node:assert/strict';
import { getFinancialTermDefinition, getFinancialTermMechanics, simplifyFinancialText, splitFinancialTerms } from '../src/lib/financialGlossary';

const segments = splitFinancialTerms('Use the Roth IRA, 529 education plan, and 401(k).');

assert.deepEqual(
  segments.filter((segment) => segment.term).map((segment) => segment.term),
  ['Roth IRA', '529 education plan', '401(k)'],
);
assert.match(getFinancialTermDefinition('Sharpe Ratio'), /amount of risk/i);
assert.match(getFinancialTermDefinition('Unlisted term'), /exact meaning depends/i);
assert.match(getFinancialTermMechanics('  CASH  FLOW '), /income.*expenses/i);
assert.match(getFinancialTermMechanics('Roth IRA'), /qualified withdrawals/i);
for (const term of ['financial health score', 'retirement age', 'life insurance', 'revolving APR', 'leveraged ETF']) {
  assert.notEqual(getFinancialTermMechanics(term), getFinancialTermDefinition(term), term);
}
assert.equal(getFinancialTermMechanics('Unlisted term'), getFinancialTermDefinition('Unlisted term'));
assert.deepEqual(splitFinancialTerms('A Roth IRAs account').map((segment) => segment.term), [undefined]);
assert.equal(
  simplifyFinancialText('A Roth IRA and a 401(k).'),
  'A retirement account funded with money you already paid taxes on and a workplace plan to save for when you stop working.',
);
