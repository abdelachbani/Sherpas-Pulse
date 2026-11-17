import assert from 'node:assert/strict';
import { storyTerms } from '../src/lib/storyTerms.ts';

assert.deepEqual(storyTerms(['A Roth IRA and an emergency fund', 'Roth IRA']), ['Roth IRA', 'emergency fund']);
assert.deepEqual(storyTerms(['A credit card with APR', 'No other terms']), ['credit card', 'APR']);
assert.deepEqual(storyTerms(['Nothing matching here']), []);

assert(storyTerms(['Health score', 'savings_and_cash_flow', 'liquidity']).some(term => term.toLowerCase() === 'cash flow'));
assert(storyTerms(['Health score']).length > 0);
assert(storyTerms(['Retirement age']).length > 0);
