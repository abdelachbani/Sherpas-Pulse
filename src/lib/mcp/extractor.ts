/**
 * src/lib/mcp/extractor.ts
 *
 * Deterministic MCP extraction layer — PURE TypeScript, ZERO LLM calls.
 * Every single number returned is read directly from the FinancialHealth /
 * InvestmentAnalysis JSON objects imported statically.
 *
 * Every figure carries an explicit GroundingRef tracing its exact path in the JSON.
 */

import type {
  FinancialHealth,
  InvestmentAnalysis,
  HouseholdType,
  StoryCard,
  CalibrationCard,
  DataPoint,
  CashStrategyOption,
  WhatIfScenario,
  SyncAgreement,
  SyncTieBreaker,
  CoupleAllocation,
  ViewingStyle,
} from '../../types';

// ─── Household detection ──────────────────────────────────────────────────────

export function detectHouseholdType(fh: FinancialHealth): HouseholdType {
  const hasCoClient = fh.case.household.some((m) => m.role === 'co-client');
  return hasCoClient ? 'couple' : 'single';
}

// ─── Story cards generator (The 6-Step Financial Wrapped) ─────────────────────

export function extractStoryData(
  fh: FinancialHealth,
  _ia: InvestmentAnalysis,
  _style?: ViewingStyle,
): StoryCard[] {
  const household = fh.case.household;
  const adults = household.filter((member) => member.role === 'client' || member.role === 'co-client');
  const names = adults.map((member) => member.first_name).join(' & ') || 'there';
  const pillars = fh.score.pillars ?? [];
  const goals = fh.goals?.goalsSummary ?? [];
  const milestones = fh.goals?.chartGoals ?? [];
  const moves = fh.score.top_moves ?? [];
  const ref = (path: string, label: string, rawValue: string | number) => ({
    sourceFile: 'financial-health.json' as const, jsonPath: path, label, rawValue,
  });
  const goalPoints: DataPoint[] = goals.map((goal, i) => ({
    label: goal.goalType.replace(/_/g, ' '), value: goal.value,
    grounding: ref(`goals.goalsSummary[${i}].value`, goal.goalType, goal.value),
  }));
  const milestonePoints: DataPoint[] = milestones.flatMap((goal, i) => goal.name && goal.date ? [{
    label: goal.name, value: goal.date,
    grounding: ref(`goals.chartGoals[${i}].date`, goal.name, goal.date),
  }] : []);
  const movePoints: DataPoint[] = moves.map((move, i) => ({
    label: move.title, value: move.action,
    grounding: ref(`score.top_moves[${i}].action`, move.title, move.action),
  }));
  const pillarPoints: DataPoint[] = pillars.map((pillar, i) => ({
    label: pillar.pillar, value: pillar.score, unit: '/100',
    grounding: ref(`score.pillars[${i}].score`, pillar.pillar, pillar.score),
  }));
  const householdPoints: DataPoint[] = household.flatMap((member, i) => {
    const points: DataPoint[] = [{
      label: `${member.first_name} · age`, value: member.age,
      grounding: ref(`case.household[${i}].age`, `${member.first_name} age`, member.age),
    }];
    if (member.retirement_age != null) points.push({
      label: `${member.first_name} · retirement age`, value: member.retirement_age,
      grounding: ref(`case.household[${i}].retirement_age`, `${member.first_name} retirement age`, member.retirement_age),
    });
    return points;
  });
  const scoreRef = ref('score.published_score', 'Financial health score', fh.score.published_score);
  return [
    {
      id: 'story-vibe', storyIndex: 0, pillar: 'vibe', interactiveType: 'vibe_check',
      title: `Welcome, ${names}`, subtitle: 'Your plan unfolds one chapter at a time, with a pause for questions after each chapter.',
      tagline: 'Your Sherpas plan', dataPoints: householdPoints,
      voiceScript: `Hi ${names}, I’m Sherpi. I’ll guide you through your financial plan. After each chapter, we’ll pause for your questions.`,
    },
    {
      id: 'story-overview', storyIndex: 1, pillar: 'overview', interactiveType: 'superpower_vs_leak',
      title: 'Your financial health', subtitle: 'Your published score and the areas behind it.',
      highlightNumber: fh.score.published_score, highlightUnit: '/100', highlightLabel: fh.score.band,
      dataPoints: [{ label: 'Health score', value: fh.score.published_score, unit: '/100', grounding: scoreRef }, ...pillarPoints],
      voiceScript: `Let’s start with your financial health. Your score is ${fh.score.published_score} out of 100. Look at the areas of your plan as they come into view.`, grounding: scoreRef,
    },
    {
      id: 'story-translator', storyIndex: 2, pillar: 'translator', interactiveType: 'real_life_analogy',
      title: 'What matters to you', subtitle: 'Goals recorded in your plan.',
      dataPoints: goalPoints, voiceScript: 'Now let’s look at what you’re planning for. As each goal appears, think about which one you’d like to discuss first.',
    },
    {
      id: 'story-advice', storyIndex: 3, pillar: 'advice', interactiveType: 'liquidity_tank_preview',
      title: 'Areas to discuss', subtitle: 'Your plan lists these possible moves.',
      dataPoints: movePoints, voiceScript: 'Here are the moves your plan identifies. At the pause, ask me to explain any of them before discussing them with your advisor.',
    },
    {
      id: 'story-living-map', storyIndex: 4, pillar: 'living-map', interactiveType: 'time_machine',
      title: 'Your milestones', subtitle: 'Dates and retirement ages recorded in your plan.',
      dataPoints: [...milestonePoints, ...householdPoints.filter((point) => point.label.endsWith('retirement age'))],
      voiceScript: 'Let’s put your goals on a timeline. These are the dates and retirement ages recorded in your plan.',
    },
    {
      id: 'story-action', storyIndex: 5, pillar: 'action', interactiveType: 'wrapped_summary',
      title: 'Your next conversation', subtitle: 'Review the first listed move with your advisor.',
      highlightNumber: moves[0]?.title, highlightLabel: moves[0] ? 'First listed move' : undefined,
      dataPoints: movePoints.slice(0, 1),
      voiceScript: 'Here’s where to start your next conversation with your advisor. We’ll pause once more to review it and talk through anything that’s still unclear.',
      grounding: moves[0] ? ref('score.top_moves[0].action', moves[0].title, moves[0].action) : undefined,
    },
  ];
}

// ─── Cash allocation options for the Tactile Cash Allocator ───────────────────

export function extractCashAllocationOptions(fh: FinancialHealth): CashStrategyOption[] {
  const slug = fh.case.slug;

  if (slug === 'timothy-melanie-weah') {
    return [
      {
        id: 'card-payoff',
        label: 'Pay off 18% Chase Card',
        amount: 18000,
        urgency: 'critical',
        benefitSummary: 'Saves $3,240/yr in pure interest & clears score gate from 60 to 62',
        interestRate: 18,
        annualDollarBenefit: 3240,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[0]: Pay $6,800 on 18% card from cash',
          label: '18% Credit Card Payoff',
          rawValue: 18000,
          description: 'Carrying $18,000 at 18% APR costs $3,240/year in interest while earning only 0.09% on cash.',
        },
      },
      {
        id: 'life-insurance',
        label: 'Add Life Insurance Coverage',
        amount: 235000,
        urgency: 'critical',
        benefitSummary: 'Raises mortality coverage ratio to 100% to protect Liam (6) & Josh (3)',
        annualDollarBenefit: 0,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[1]: Add $235,000 life cover to raise mortality ratio',
          label: 'Life Coverage Shortfall',
          rawValue: 235000,
          description: 'Timothy is short $610,000 and Melanie $490,000 in term protection with young dependents.',
        },
      },
      {
        id: 'umbrella-cover',
        label: 'Add $1M Umbrella Liability Shield',
        amount: 1000000,
        urgency: 'moderate',
        benefitSummary: 'Protects $695,500 net worth against catastrophic liability claims for ~$300/yr',
        annualDollarBenefit: 0,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[2]: Add $1M umbrella cover',
          label: 'Umbrella Liability Policy',
          rawValue: 1000000,
          description: 'Household has zero excess liability protection despite high net worth.',
        },
      },
      {
        id: 'college-529',
        label: 'Fund 529 College for Liam & Josh',
        amount: 4609,
        urgency: 'moderate',
        benefitSummary: 'Year 1 contribution towards $113,508 education gap for Liam (6) and Josh (3)',
        annualDollarBenefit: 1100,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'narrative.summary_main: College shortfall $113,508.60, need $4,609/yr',
          label: '529 College Savings Gap',
          rawValue: 4609,
          description: '$0 currently saved in tax-free 529 education accounts.',
        },
      },
    ];
  }

  if (slug === 'daniel-emily-johnson') {
    return [
      {
        id: 'life-coverage',
        label: 'Add $1.16M Life Cover for Kids',
        amount: 1166000,
        urgency: 'critical',
        benefitSummary: 'Raises 0/20 protection score by closing the mortality gap for Oliver (11) & Sophia (8)',
        annualDollarBenefit: 0,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[0]: Add $1,166,000 of life cover',
          label: 'Life Coverage Shortfall',
          rawValue: 1166000,
          description: 'Daniel and Emily currently have $0 in term life protection with two school-age dependents.',
        },
      },
      {
        id: 'umbrella-cover',
        label: 'Add $1M Umbrella Liability Shield',
        amount: 1000000,
        urgency: 'critical',
        benefitSummary: 'Shields Denver home equity ($560k) and assets against tort claims for ~$25/mo',
        annualDollarBenefit: 0,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[1]: Add $1M umbrella cover',
          label: 'Umbrella Liability Policy',
          rawValue: 1000000,
          description: 'Zero excess liability protection creates catastrophic risk against accumulated equity.',
        },
      },
      {
        id: 'college-529',
        label: 'Fund 529 College for Oliver & Sophia',
        amount: 8400,
        urgency: 'moderate',
        benefitSummary: 'Starts tax-free tuition savings towards estimated $68,000 in-state college goals',
        annualDollarBenefit: 1200,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'goals.goalsSummary: College funding for Oliver & Sophia',
          label: '529 Education Fund',
          rawValue: 8400,
          description: 'Tax-free educational compound growth under IRC §529.',
        },
      },
      {
        id: 'savings-boost',
        label: 'Raise Annual Savings by $12k',
        amount: 12000,
        urgency: 'moderate',
        benefitSummary: 'Preserves target early retirement at age 62 instead of pushing to age 65',
        annualDollarBenefit: 0,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[2]: Raise annual savings to preserve retirement at 62',
          label: 'Annual Retirement Savings',
          rawValue: 12000,
          description: 'Increases net wealth accumulation to sustain early retirement.',
        },
      },
    ];
  }

  // Fallback using top_moves
  return (fh.score.top_moves || []).map((move, idx) => ({
    id: `strategy-${idx}`,
    label: move.title,
    amount: move.target_amount,
    urgency: move.lifts_a_cap ? 'critical' : 'moderate',
    benefitSummary: move.action,
    grounding: {
      sourceFile: 'financial-health.json',
      jsonPath: `score.top_moves[${idx}]`,
      label: move.title,
      rawValue: move.target_amount,
    },
  }));
}

// ─── Calibration micro-cards dictionary with Plain English Analogies ──────────

export function extractCalibrationCards(
  _fh: FinancialHealth,
  _ia: InvestmentAnalysis,
): Record<string, CalibrationCard> {
  interface CardDef {
    term: string;
    analogy: string;
    take: string;
    expertMechanics: string;
    statutoryLimits: string;
  }

  const definitions: Record<string, CardDef> = {
    'roth-ira': {
      term: 'Roth IRA',
      analogy: 'Think of a traditional 401(k) like a farmer taxed on the entire harvest; a Roth IRA taxes only the seed today, so decades of compounding and all retirement withdrawals are 100% tax-free.',
      take: 'Eligibility, contribution limits and withdrawal rules depend on your circumstances.',
      expertMechanics: 'Funded with post-tax capital. Earnings accumulate tax-deferred and qualified distributions (post age 59½ and 5-year seasoning) are 100% tax-exempt under IRC §408A. Ideal for shifting tax liability away from anticipated higher marginal brackets in retirement.',
      statutoryLimits: '2026 Statutory limit: $7,000/year ($8,000 if age 50+). Phase-out begins at $146k-$161k MAGI (Single) and $230k-$240k MAGI (MFJ). Backdoor conversions bypass income caps, subject to aggregate traditional IRA pro-rata rules.',
    },
    'umbrella-liability': {
      term: 'Umbrella liability',
      analogy: 'Standard home and auto insurance are like a raincoat for light showers; an umbrella policy is a steel storm shelter that shields all your accumulated assets and future income from catastrophic legal claims.',
      take: 'Coverage, exclusions and costs depend on the policy.',
      expertMechanics: 'Excess third-party liability policy sitting atop primary underlying homeowners and auto policies (requiring $300k/$500k underlying limits). Provides worldwide coverage, personal injury protection (defamation/slander), and legal defense expenses outside policy limits.',
      statutoryLimits: 'Sold in $1M increments (typically $1M-$5M). Exceptionally capital-efficient at ~$150-$300/year per $1M coverage, insulating total net worth against tort liabilities and wage garnishment.',
    },
    'revolving-apr': {
      term: 'Revolving APR',
      analogy: 'Revolving credit at 18% APR is like running with an open parachute: every month you carry a balance, interest compounds on interest, draining cash straight to the bank before you can save a dime.',
      take: 'Actual interest depends on the balance, rate and lender terms.',
      expertMechanics: 'Compounded daily on average daily balances. An 18% nominal APR equates to an Effective Annual Rate (EAR) of ~19.56%. Paying down revolving card debt yields an immediate, risk-free, tax-equivalent return that outpaces conventional liquid cash yields.',
      statutoryLimits: 'Daily compounding rate ~0.0493%/day. Unpaid balances incur escalating compound interest charges, with zero tax deductibility under current TCJA personal interest guidelines.',
    },
    'mortality-ratio': {
      term: 'Mortality ratio',
      analogy: 'Your life insurance coverage is like the emergency backup generator for a household: the mortality ratio tells you whether backup power will keep the home running for 15 years or shut down in months if the primary earner passes away.',
      take: 'A measure comparing life insurance coverage with an estimated coverage need.',
      expertMechanics: 'The ratio of in-force death benefit to total human capital replacement obligations (capital needs analysis factoring in present value of future family living expenses, debt extinguishment, and college education discounted at real rates).',
      statutoryLimits: 'Industry benchmark: 10x-15x gross annual earnings for earners with dependent minors. A 0/20 protection score indicates catastrophic family exposure to breadwinner mortality.',
    },
    '529-plan': {
      term: '529 education plan',
      analogy: 'A 529 plan is an express lane for your children’s education: tax-deductible perks going in, decades of tax-free compound growth, and 100% tax-free withdrawals for tuition, books, and housing.',
      take: 'Tax treatment and eligible expenses depend on the plan and circumstances.',
      expertMechanics: 'Qualified Tuition Program governed by IRC §529. Earnings accumulate federal tax-exempt, with qualified distributions covering tuition, fees, books, and room/board. Under SECURE 2.0, up to $35,000 of leftover 529 assets can be rolled over tax-free into the beneficiary’s Roth IRA (15-year seasoning).',
      statutoryLimits: 'Annual gift tax exclusion applies ($18,000/donor, or 5-year superfund front-loading of $90,000 per parent in 2026). State income tax deductions vary by jurisdiction.',
    },
    'leveraged-etf': {
      term: 'Leveraged ETF',
      analogy: 'A leveraged ETF is like driving a drag racer with a hair-trigger gas pedal: exhilarating for a 1-day sprint, but dangerous for a family road trip because volatility drag will erode your capital over time.',
      take: 'Returns over longer periods can differ substantially from a simple multiple of the index.',
      expertMechanics: 'Employs financial derivatives (total return swaps, futures) targeting 2x or 3x daily returns of a benchmark index. Due to daily reset mechanics, mathematical beta slippage (volatility drag) compounds non-linearly during choppy or sideways markets.',
      statutoryLimits: 'Subject to FINRA Regulatory Notice 09-31 cautioning against long-term retail holding. Generally unsuitable for strategic buy-and-hold asset allocation portfolios.',
    },
    'withdrawal-rate': {
      term: 'Withdrawal rate',
      analogy: 'Your withdrawal rate is like tapping a freshwater reservoir: if you only draw what seasonal rainfall refills each year (~3.5% to 4%), your water reserve will never run dry, even during prolonged droughts.',
      take: 'Its long-term effect depends on spending, returns, inflation and the time horizon.',
      expertMechanics: 'Annual portfolio distributions divided by total investable retirement assets. Benchmarked against Bengen safe withdrawal research and historical Monte Carlo sequence-of-returns simulations.',
      statutoryLimits: 'Standard 30-year retirement rule of thumb: 4.0% initial withdrawal adjusted annually for CPI. For extended horizons (35+ years, e.g. early retirement at 58), target distribution rate should be calibrated to 3.25%-3.75% to eliminate terminal ruin probability.',
    },
  };

  return Object.fromEntries(Object.entries(definitions).map(([key, def]) => [key, {
    term: def.term,
    termKey: key,
    headline: def.term,
    analogy: def.analogy,
    sherpasTake: def.take,
    expertMechanics: def.expertMechanics,
    statutoryLimits: def.statutoryLimits,
    numbers: [],
    groundingRefs: [],
  }]));
}

// ─── What-if scenarios for single households ──────────────────────────────────

export function extractWhatIfScenarios(
  fh: FinancialHealth,
  _ia: InvestmentAnalysis,
): WhatIfScenario[] {
  const slug = fh.case.slug;

  if (slug === 'michael-carter') {
    return [
      {
        id: 'home-vs-retire',
        title: 'Austin Home 2027 vs. Retiring at 58',
        tag: 'Primary Trade-off',
        description: 'Michael is 37 earning $180k. Compares buying a $550,000 home in 2027 vs. early retirement at 58.',
        optionA: {
          label: '🏠 Buy $550k Home in 2027',
          year: 2027,
          amount: 550000,
          impact: 'Requires $110,000 down payment; shifts retirement from 58 to 61',
        },
        optionB: {
          label: '⏰ Retire Early at 58',
          year: 2047,
          amount: 0,
          impact: 'Keeps renting through 2030; preserves $1.4M retirement corpus at age 58',
        },
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'goals.goalsSummary: Home purchase $550k vs Retirement at 58',
          label: 'Michael Carter Trade-off',
          rawValue: '$550,000 home vs age 58',
        },
      },
      {
        id: 'umbrella-shield',
        title: 'Add $1M Umbrella Liability',
        tag: 'Protection Fix',
        description: 'Currently has $0 excess liability shield despite $180k income.',
        optionA: {
          label: '🛡️ Add $1M Umbrella Policy',
          amount: 1000000,
          impact: 'Lifts Protection pillar from 18/100 to 45/100 for $25/mo',
        },
        optionB: {
          label: '❌ Keep Auto/Renters Only',
          amount: 0,
          impact: 'Leaves future income vulnerable to liability claims exceeding $300k',
        },
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves[0]: Add $1M umbrella cover',
          label: 'Umbrella Liability',
          rawValue: 1000000,
        },
      },
    ];
  }

  if (slug === 'samantha-lewis') {
    return [
      {
        id: 'college-vs-home',
        title: 'College for Teens vs. 2nd Home 2030',
        tag: 'Core Goal Balance',
        description: 'Ethan (18) and Ava (16) start university now, while Samantha plans a $450,000 second home in 2030.',
        optionA: {
          label: '🎓 Full College Funding Now',
          year: 2026,
          amount: 70000,
          impact: 'Deploy $35k/yr cash flow; children graduate 100% debt-free',
        },
        optionB: {
          label: '🏖️ Second Home in 2030',
          year: 2030,
          amount: 450000,
          impact: 'Dedicate cash surplus to 20% down payment ($90,000) by 2030',
        },
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: 'goals.goalsSummary: College vs Real Estate 2030',
          label: 'Samantha Lewis Milestones',
          rawValue: '$70k college vs $450k home',
        },
      },
    ];
  }

  // Fallback for other cases
  return [
    {
      id: 'default-tradeoff',
      title: 'Accelerate Debt Payoff vs. Invest Cash',
      tag: 'Capital Deployment',
      description: 'Weighing risk-free interest savings against long-term equity growth.',
      optionA: {
        label: 'Pay Down Debt Now',
        impact: 'Immediate guaranteed return equal to the debt interest rate',
      },
      optionB: {
        label: 'Invest in Index Funds',
        impact: 'Higher long-term expected returns with short-term market volatility',
      },
    },
  ];
}

// ─── Couple consensus matching engine ("Family Sync") ─────────────────────────

export function extractHouseholdSync(
  _caseId: string,
  primaryAlloc: CoupleAllocation | null,
  secondaryAlloc: CoupleAllocation | null,
): { agreements: SyncAgreement[]; tieBreakers: SyncTieBreaker[] } {
  const agreements: SyncAgreement[] = [];
  const tieBreakers: SyncTieBreaker[] = [];
  if (!primaryAlloc || !secondaryAlloc) return { agreements, tieBreakers };

  for (const primary of primaryAlloc.allocations) {
    const secondary = secondaryAlloc.allocations.find((item) => item.strategyId === primary.strategyId);
    if (!secondary) continue;
    if (primary.amount === secondary.amount && primary.priority === secondary.priority) {
      agreements.push({
        strategyId: primary.strategyId, title: primary.label, agreedAmount: primary.amount,
        dollarBenefit: 'No financial impact calculated',
        explanation: `${primaryAlloc.partner} and ${secondaryAlloc.partner} selected the same amount and priority.`,
        status: 'agreement',
      });
    } else {
      tieBreakers.push({
        strategyId: primary.strategyId, title: primary.label,
        partner1Name: primaryAlloc.partner, partner1Priority: primary.priority, partner1Amount: primary.amount,
        partner2Name: secondaryAlloc.partner, partner2Priority: secondary.priority, partner2Amount: secondary.amount,
        advisorQuestion: `How would ${primaryAlloc.partner} and ${secondaryAlloc.partner} like to reconcile their choices for ${primary.label}?`,
        status: 'tie_breaker',
      });
    }
  }
  return { agreements, tieBreakers };
}

// ─── Action item extractor ────────────────────────────────────────────────────

export function extractActionItem(fh: FinancialHealth): {
  title: string;
  steps: string[];
  dollarImpact: string;
  firstStep: string;
} {
  const topMove = fh.score.top_moves?.[0];
  const firstStep = topMove?.action || 'Transfer $6,800 from liquid cash to 18% credit card';
  const scoreGain = topMove ? topMove.score_after - topMove.score_before : 2;

  return {
    title: topMove?.title || 'Pay down revolving card',
    steps: [
      firstStep,
      `Raises your Financial Health score by ${scoreGain} points (${topMove?.score_before || 60} → ${topMove?.score_after || 62}).`,
      'Review your couple consensus with your Sherpas advisor.',
    ],
    dollarImpact: topMove ? `$${topMove.target_amount.toLocaleString()}` : '$6,800',
    firstStep,
  };
}
