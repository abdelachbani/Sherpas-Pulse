/**
 * server/caseBrief.ts
 *
 * Case brief formatting and summaries for Sherpas Pulse.
 * Injected into AI session instructions to enforce strict grounding.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = existsSync(resolve(process.cwd(), 'cases')) ? process.cwd() : resolve(here, '..');
export const CASES_DIR = existsSync(resolve(root, 'cases')) ? resolve(root, 'cases') : resolve(process.cwd(), 'cases');

export function readJson(path: string) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function getCaseIds(): string[] {
  return existsSync(CASES_DIR)
    ? readdirSync(CASES_DIR)
        .filter((id) => existsSync(join(CASES_DIR, id, 'financial-health.json')))
        .sort()
    : [];
}

export function caseLabel(id: string): string {
  const fh = readJson(join(CASES_DIR, id, 'financial-health.json'));
  const adults = (fh?.case?.household ?? [])
    .filter((p: any) => p.role !== 'child')
    .map((p: any) => p.first_name);
  return `${adults.join(' & ') || id}${fh?.case?.city ? `, ${fh.case.city}` : ''}${
    fh?.score ? ` (score ${fh.score.published_score})` : ''
  }`;
}

export function caseSummary(id: string) {
  const fh = readJson(join(CASES_DIR, id, 'financial-health.json'));
  const ia = readJson(join(CASES_DIR, id, 'investment-analysis.json'));
  if (!fh) return null;
  return {
    id,
    label: caseLabel(id),
    household: fh.case.household,
    city: fh.case.city,
    state: fh.case.state,
    score: fh.score?.published_score,
    band: fh.score?.band,
    colour: fh.score?.colour,
    householdType: fh.case.household.some((m: any) => m.role === 'co-client')
      ? 'couple'
      : 'single',
    topMove: fh.score?.top_moves?.[0] ?? null,
    hasInvestmentAnalysis: !!ia,
  };
}

export function caseBrief(id: string): string {
  const fh = readJson(join(CASES_DIR, id, 'financial-health.json'));
  const ia = readJson(join(CASES_DIR, id, 'investment-analysis.json'));
  if (!fh) return '';

  const people = (fh.case?.household ?? [])
    .map(
      (p: any) =>
        `${p.first_name} (${p.role}, age ${p.age}${
          p.retirement_age ? `, retiring at ${p.retirement_age}` : ''
        })`
    )
    .join(', ');

  const pillars = (fh.score?.pillars ?? [])
    .map((p: any) => `${p.pillar}: ${p.score}/100`)
    .join('; ');

  const topMoves = (fh.score?.top_moves ?? [])
    .slice(0, 3)
    .map(
      (m: any, i: number) =>
        `  ${i + 1}. ${m.title}: ${m.action} (${
          m.target_amount != null ? `target: $${m.target_amount.toLocaleString()}, ` : ''
        }score ${m.score_before}→${m.score_after})`
    )
    .join('\n');

  const caps = (fh.score?.caps_applied ?? [])
    .map((c: any) => `${c.reason} (capped at ${c.score_capped_at})`)
    .join('; ');

  const goals = (fh.goals?.goalsSummary ?? [])
    .map(
      (g: any) =>
        `${g.goalType}${g.subType ? `/${g.subType}` : ''}: ${g.value}${
          g.amount ? ` ($${g.amount.toLocaleString()})` : ''
        }`
    )
    .join('; ');

  const totalInvested = (ia?.positions ?? []).reduce(
    (sum: number, p: any) => sum + (typeof p.value === 'number' ? p.value : 0),
    0
  );

  const lines = [
    `You are Sherpi, the Sherpas guide helping this household understand its financial plan and prepare questions for their advisor.`,
    `Use ONLY the figures below — never invent numbers. Keep answers short and conversational.`,
    ``,
    `=== HOUSEHOLD ===`,
    `Members: ${people}`,
    `Location: ${fh.case?.city ?? ''}, ${fh.case?.state ?? ''}`,
    ``,
    `=== FINANCIAL HEALTH ===`,
    `Score: ${fh.score?.published_score}/100 (${fh.score?.band} · ${fh.score?.colour})`,
    `Pillars: ${pillars}`,
    caps ? `Score caps: ${caps}` : null,
    ``,
    fh.score?.message ? `Score message: "${fh.score.message}"` : null,
    ``,
    `=== TOP MOVES ===`,
    topMoves,
    ``,
    goals ? `=== GOALS ===\n${goals}` : null,
    ``,
    fh.narrative?.summary_main
      ? `=== PLAN SUMMARY ===\n${fh.narrative.summary_main}`
      : null,
    fh.narrative?.summary_recommendations
      ? `=== RECOMMENDATIONS ===\n${fh.narrative.summary_recommendations}`
      : null,
    ``,
    totalInvested > 0
      ? `=== INVESTMENTS ===\nTotal invested: $${totalInvested.toLocaleString()}`
      : null,
    ia?.narrative?.summary_main
      ? `Investment summary: ${ia.narrative.summary_main}`
      : null,
  ];

  return lines.filter(Boolean).join('\n');
}
