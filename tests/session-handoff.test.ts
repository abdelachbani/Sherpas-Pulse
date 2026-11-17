import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAdvisorQuestions, formatSessionHandoff } from '../src/lib/sessionHandoff';

test('uses the latest completed tradeoff for the selected case and describes its options', () => {
  const scenarios = [{ id: 'home', title: 'Home or retirement', optionA: { label: 'Home', impact: '' }, optionB: { label: 'Retirement', impact: '' } }];
  const events: any[] = [
    { type: 'allocation_set', payload: { caseId: 'other', scenarioId: 'home', choice: 'A', starsA: 1, starsB: 1, weightA: 50, weightB: 50, timelineYear: 2026 }, timestamp: 1 },
    { type: 'allocation_set', payload: { caseId: 'case', scenarioId: 'home', choice: 'balanced', starsA: 4, starsB: 3, weightA: 57, weightB: 43, timelineYear: 2040 }, timestamp: 2 },
    { type: 'allocation_set', payload: { caseId: 'case', action: 'copy_nudge' }, timestamp: 3 },
  ];
  const text = formatSessionHandoff('case', events, { primary: null, secondary: null }, scenarios);
  assert.match(text, /Home or retirement/); assert.match(text, /Balanced/); assert.match(text, /Home: 4\/5 \(57%\)/); assert.match(text, /2040/);
});

test('shows ranked saved choices and their differences without inventing a review', () => {
  const primary = { partner: 'Alex', allocations: [{ strategyId: 'x', label: 'Protect', amount: 100, priority: 1 }] };
  const secondary = { partner: 'Sam', allocations: [{ strategyId: 'x', label: 'Protect', amount: 200, priority: 2 }] };
  const text = formatSessionHandoff('case', [], { primary, secondary }, []);
  assert.match(text, /may include demo partner/); assert.match(text, /Alex: #1 Protect — \$100/); assert.match(text, /Sam: #2 Protect — \$200/); assert.match(text, /Different choices: Protect/);
  assert.doesNotMatch(formatSessionHandoff('case', [], { primary, secondary: null }, []), /Different choices/);
});

test('orders saved single-household options by their rating', () => {
  const scenarios = [{ id: 'home', title: 'Home or retirement', optionA: { label: 'Home', impact: '' }, optionB: { label: 'Retirement', impact: '' } }];
  const events: any[] = [{ type: 'allocation_set', payload: { caseId: 'case', scenarioId: 'home', choice: 'B', starsA: 2, starsB: 5, weightA: 29, weightB: 71 }, timestamp: 1 }];
  const lines = formatSessionHandoff('case', events, { primary: null, secondary: null }, scenarios).split('\n');
  assert(lines.indexOf('Retirement: 5/5 (71%)') < lines.indexOf('Home: 2/5 (29%)'));
});

test('suggests three advisor questions from the most repeated hesitation steps and terms', () => {
  const events: any[] = [
    { type: 'hesitation_pause', payload: { chapterId: 'health', chapterTitle: 'Financial health' }, timestamp: 1 },
    { type: 'hesitation_pause', payload: { chapterId: 'health', chapterTitle: 'Financial health' }, timestamp: 2 },
    { type: 'tap_to_define', payload: { term: 'Roth IRA', termKey: 'roth ira' }, timestamp: 3 },
    { type: 'tap_to_define', payload: { term: 'Roth IRA', termKey: 'roth ira' }, timestamp: 4 },
    { type: 'tap_to_define', payload: { term: '529', termKey: '529' }, timestamp: 5 },
  ];

  const questions = buildAdvisorQuestions(events, ['Build an emergency fund']);
  assert.equal(questions.length, 3);
  assert.match(questions[0], /Financial health/);
  assert.match(questions[1], /Roth IRA/);
  assert.match(questions[2], /529/);
});

test('returns three usable advisor questions when the session has no doubt signals', () => {
  assert.equal(buildAdvisorQuestions([], []).length, 3);
});
