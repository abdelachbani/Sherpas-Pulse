// ─── Household & Case types ───────────────────────────────────────────────────

export interface HouseholdMember {
  first_name: string;
  role: 'client' | 'co-client' | 'child';
  age: number;
  retirement_age?: number;
  risk_profile?: string;
  employment?: string;
}

export interface Case {
  slug: string;
  household: HouseholdMember[];
  city?: string;
  state?: string;
  zip_code?: string;
  tax_filing_status?: string;
  synthetic?: boolean;
}

export interface PillarScore {
  pillar: string;
  score: number;
  points_shown_in_app?: string;
}

export interface TopMove {
  title: string;
  action: string;
  effort: string;
  target_amount: number;
  score_before: number;
  score_after: number;
  lifts_a_cap: boolean;
}

export interface GoalSummary {
  goalType: string;
  value: string;
  amount?: number;
  subType?: string;
}

export interface ChartGoal {
  date: string;
  goalType: string;
  name: string;
  termDate?: string;
  subType?: string;
  amount?: number;
}

export interface FinancialHealth {
  schema_version: number;
  part: string;
  case: Case;
  score: {
    published_score: number;
    scale?: string;
    band: string;
    colour: string;
    message: string;
    pillars: PillarScore[];
    caps_applied: { reason: string; score_capped_at: number }[];
    top_moves: TopMove[];
    explainer: string;
    combined_moves?: { moves: string[]; score_after: number; note: string }[];
  };
  narrative?: {
    summary_main?: string;
    summary_recommendations?: string;
  };
  goals?: {
    goalsSummary?: GoalSummary[];
    chartGoals?: ChartGoal[];
  };
}

export interface Position {
  ticker?: string;
  name?: string;
  value?: number;
  asset_class?: string;
  account_type?: string;
  owner?: string;
  weight_in_account?: number;
  expense_ratio?: number | null;
  [key: string]: unknown;
}

export interface InvestmentAnalysis {
  schema_version: number;
  part: string;
  case: Case;
  narrative: {
    summary_main?: string;
    recommendations_main?: string;
    snapshot_main?: string;
    portfolio_today_intro?: string;
    portfolio_today_what_it_needs_to_do?: string;
    portfolio_today_what_its_actually_doing?: string;
    recommendations_scenarios?: string;
    portfolio_today_verdict?: string;
    [key: string]: string | undefined;
  };
  positions?: Position[];
}

// ─── UI & Grounding types ────────────────────────────────────────────────────

export type HouseholdType = 'couple' | 'single';
export type ViewingStyle = 'analytical' | 'visual' | 'express';

export interface GroundingRef {
  sourceFile: 'financial-health.json' | 'investment-analysis.json' | 'persona.md';
  jsonPath: string;
  label: string;
  rawValue: string | number;
  description?: string;
}

export interface DataPoint {
  label: string;
  value: string | number;
  unit?: string;
  highlight?: boolean;
  grounding?: GroundingRef;
}

export interface StoryCard {
  id: string;
  storyIndex: number;
  pillar: 'vibe' | 'overview' | 'translator' | 'advice' | 'living-map' | 'action';
  title: string;
  subtitle: string;
  tagline?: string;
  highlightNumber?: string | number;
  highlightUnit?: string;
  highlightLabel?: string;
  dataPoints: DataPoint[];
  voiceScript: string;
  interactiveType?: 'vibe_check' | 'superpower_vs_leak' | 'real_life_analogy' | 'liquidity_tank_preview' | 'time_machine' | 'wrapped_summary';
  grounding?: GroundingRef;
}

export interface CalibrationCard {
  term: string;
  termKey: string;
  headline: string;
  analogy: string;
  sherpasTake: string;
  numbers: DataPoint[];
  groundingRefs: GroundingRef[];
}

export interface TelemetryEvent {
  type: 'term_tap' | 'pause' | 'voice_ask' | 'allocation_set' | 'story_complete' | 'style_select' | 'grounding_view';
  payload: Record<string, unknown>;
  timestamp: number;
  storyId?: string;
}

export interface CashStrategyOption {
  id: string;
  label: string;
  amount: number;
  urgency: 'critical' | 'moderate' | 'optional';
  benefitSummary: string;
  interestRate?: number;
  annualDollarBenefit?: number;
  grounding?: GroundingRef;
}

export interface CoupleAllocationItem {
  strategyId: string;
  label: string;
  amount: number;
  priority: number; // 1 = highest
}

export interface CoupleAllocation {
  partner: string;
  allocations: CoupleAllocationItem[];
}

export interface SyncAgreement {
  strategyId: string;
  title: string;
  agreedAmount: number;
  dollarBenefit: string;
  explanation: string;
  status: 'agreement';
}

export interface SyncTieBreaker {
  strategyId: string;
  title: string;
  partner1Name: string;
  partner1Priority: number;
  partner1Amount: number;
  partner2Name: string;
  partner2Priority: number;
  partner2Amount: number;
  advisorQuestion: string;
  status: 'tie_breaker';
}

export interface WhatIfScenario {
  id: string;
  title: string;
  tag: string;
  description: string;
  optionA: { label: string; year?: number; amount?: number; impact: string };
  optionB: { label: string; year?: number; amount?: number; impact: string };
  grounding?: GroundingRef;
}

export interface CaseData {
  id: string;
  financialHealth: FinancialHealth;
  investmentAnalysis: InvestmentAnalysis;
  persona?: string;
  householdType: HouseholdType;
}
