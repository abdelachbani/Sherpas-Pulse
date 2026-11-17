import type { CoupleAllocation, TelemetryEvent, WhatIfScenario } from '../types';
import { extractHouseholdSync } from './mcp/extractor';

export function formatSessionHandoff(caseId: string, events: TelemetryEvent[], allocations: { primary: CoupleAllocation | null; secondary: CoupleAllocation | null }, scenarios: WhatIfScenario[]): string {
  const lines: string[] = [];
  const event = [...events].reverse().find(({ type, payload }) => type === 'allocation_set' && payload.caseId === caseId && typeof payload.scenarioId === 'string' && ['A', 'B', 'balanced'].includes(String(payload.choice)));
  if (event) {
    const p = event.payload;
    const scenario = scenarios.find((s) => s.id === p.scenarioId);
    const a = scenario?.optionA.label ?? 'Option A';
    const b = scenario?.optionB.label ?? 'Option B';
    lines.push(`Trade-off: ${scenario?.title ?? String(p.scenarioId)}`);
    lines.push(`Choice: ${p.choice === 'balanced' ? 'Balanced' : p.choice === 'A' ? a : b}`);
    const ratings = [
      { label: a, stars: p.starsA, weight: p.weightA },
      { label: b, stars: p.starsB, weight: p.weightB },
    ].flatMap(({ label, stars, weight }) => typeof stars === 'number' && typeof weight === 'number' ? [{ label, stars, weight }] : []);
    for (const { label, stars, weight } of ratings.sort((one, two) => two.stars - one.stars)) {
      lines.push(`${label}: ${stars}/5 (${weight}%)`);
    }
    if (typeof p.timelineYear === 'number') lines.push(`Timeline year: ${p.timelineYear}`);
  }
  const saved = [allocations.primary, allocations.secondary].filter((item): item is CoupleAllocation => item !== null);
  if (saved.length) {
    if (lines.length) lines.push('');
    lines.push('Saved session choices (may include demo partner):');
    for (const partner of saved) for (const item of [...partner.allocations].sort((a, b) => a.priority - b.priority)) lines.push(`${partner.partner}: #${item.priority} ${item.label} — $${item.amount.toLocaleString()}`);
    if (allocations.primary && allocations.secondary) {
      const { agreements, tieBreakers } = extractHouseholdSync(caseId, allocations.primary, allocations.secondary);
      if (agreements.length) lines.push(`Matching choices: ${agreements.map((a) => a.title).join(', ')}`);
      if (tieBreakers.length) lines.push(`Different choices: ${tieBreakers.map((a) => a.title).join(', ')}`);
    }
  }
  return lines.join('\n');
}

export function buildAdvisorQuestions(events: readonly TelemetryEvent[], recommendationTitles: readonly string[] = []): string[] {
  const hesitationByStep = new Map<string, { title: string; count: number }>();
  const termsByKey = new Map<string, { term: string; count: number }>();
  let tradeoffChanges = 0;
  let allocationChanges = 0;

  for (const event of events) {
    if (event.type === 'hesitation_pause') {
      const title = typeof event.payload.chapterTitle === 'string' ? event.payload.chapterTitle.trim() : '';
      if (!title) continue;
      const key = typeof event.payload.chapterId === 'string' ? event.payload.chapterId : title.toLowerCase();
      const step = hesitationByStep.get(key) ?? { title, count: 0 };
      step.count += 1;
      hesitationByStep.set(key, step);
    } else if (event.type === 'tap_to_define') {
      const term = typeof event.payload.term === 'string' ? event.payload.term.trim() : '';
      if (!term) continue;
      const key = typeof event.payload.termKey === 'string' ? event.payload.termKey.toLowerCase() : term.toLowerCase();
      const entry = termsByKey.get(key) ?? { term, count: 0 };
      entry.count += 1;
      termsByKey.set(key, entry);
    } else if (event.type === 'tradeoff_change') {
      tradeoffChanges += 1;
    } else if (event.type === 'allocation_change') {
      allocationChanges += 1;
    }
  }

  const candidates = [
    ...[...hesitationByStep.values()]
      .sort((a, b) => b.count - a.count)
      .map(({ title }) => `Could we revisit “${title}” and clarify which part felt uncertain?`),
    ...[...termsByKey.values()]
      .sort((a, b) => b.count - a.count)
      .map(({ term }) => `Could you explain how ${term} affects this household’s plan?`),
    ...(tradeoffChanges ? ['Which trade-off felt hardest to decide, and what information would make it clearer?'] : []),
    ...(allocationChanges ? ['Which priority should the household fund first, and why?'] : []),
    ...recommendationTitles.filter(Boolean).map((title) => `What is the smallest first step toward “${title}”?`),
    'Which part of the plan feels least clear right now?',
    'What is one manageable next step the household can take?',
    'What should we revisit at the next check-in?',
  ];

  return [...new Set(candidates)].slice(0, 3);
}
