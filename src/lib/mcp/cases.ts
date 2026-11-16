/**
 * src/lib/mcp/cases.ts
 *
 * Static case registry — imports all 4 case JSON files at build time via Vite.
 * JSON is resolved by TypeScript (resolveJsonModule: true) and bundled as
 * static assets. No filesystem access at runtime.
 */

import type { CaseData, FinancialHealth, InvestmentAnalysis } from '../../types';
import { detectHouseholdType } from './extractor';

// ─── Timothy & Melanie Weah (couple, San Francisco CA) ───────────────────────
import timothyFH from '../../../cases/timothy-melanie-weah/financial-health.json';
import timothyIA from '../../../cases/timothy-melanie-weah/investment-analysis.json';

// ─── Daniel & Emily Johnson (couple, Denver CO) ───────────────────────────────
import danielFH from '../../../cases/daniel-emily-johnson/financial-health.json';
import danielIA from '../../../cases/daniel-emily-johnson/investment-analysis.json';

// ─── Michael Carter (single, Austin TX) ──────────────────────────────────────
import michaelFH from '../../../cases/michael-carter/financial-health.json';
import michaelIA from '../../../cases/michael-carter/investment-analysis.json';

// ─── Samantha Lewis (single, Miami FL) ───────────────────────────────────────
import samanthaFH from '../../../cases/samantha-lewis/financial-health.json';
import samanthaIA from '../../../cases/samantha-lewis/investment-analysis.json';

// ─── Build the typed registry ─────────────────────────────────────────────────

function makeCase(
  id: string,
  fh: FinancialHealth,
  ia: InvestmentAnalysis,
): CaseData {
  return {
    id,
    financialHealth:    fh,
    investmentAnalysis: ia,
    householdType:      detectHouseholdType(fh),
  };
}

export const CASES: CaseData[] = [
  makeCase('timothy-melanie-weah', timothyFH as unknown as FinancialHealth, timothyIA as unknown as InvestmentAnalysis),
  makeCase('daniel-emily-johnson', danielFH  as unknown as FinancialHealth, danielIA  as unknown as InvestmentAnalysis),
  makeCase('michael-carter',       michaelFH as unknown as FinancialHealth, michaelIA as unknown as InvestmentAnalysis),
  makeCase('samantha-lewis',       samanthaFH as unknown as FinancialHealth, samanthaIA as unknown as InvestmentAnalysis),
];

/** Look up a case by its slug/id. */
export function findCase(id: string): CaseData | undefined {
  return CASES.find((c) => c.id === id);
}
