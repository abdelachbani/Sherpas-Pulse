/**
 * server/caseBrief.ts
 *
 * Case brief formatting and summaries for Sherpas Pulse.
 * Injected into AI session instructions to enforce strict grounding.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatCaseBrief } from './voiceCaseBrief.mjs';

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
  return formatCaseBrief(
    readJson(join(CASES_DIR, id, 'financial-health.json')),
    readJson(join(CASES_DIR, id, 'investment-analysis.json')),
  );
}
