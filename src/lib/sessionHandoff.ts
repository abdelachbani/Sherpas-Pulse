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
    if (typeof p.starsA === 'number' && typeof p.weightA === 'number') lines.push(`${a}: ${p.starsA}/5 (${p.weightA}%)`);
    if (typeof p.starsB === 'number' && typeof p.weightB === 'number') lines.push(`${b}: ${p.starsB}/5 (${p.weightB}%)`);
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
