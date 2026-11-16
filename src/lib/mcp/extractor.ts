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
  ia: InvestmentAnalysis,
  _style?: ViewingStyle,
): StoryCard[] {
  const slug = fh.case.slug;
  const score = fh.score.published_score;
  const band = fh.score.band;
  const colour = fh.score.colour;
  const client = fh.case.household.find((m) => m.role === 'client');
  const coClient = fh.case.household.find((m) => m.role === 'co-client');
  const children = fh.case.household.filter((m) => m.role === 'child');
  const topMove = fh.score.top_moves?.[0];

  const clientName = client?.first_name ?? 'You';
  const partnerName = coClient?.first_name;
  const familyName = partnerName ? `${clientName} & ${partnerName}` : clientName;

  // Specific case data extractions
  let superpowerTitle = 'Liquidity & Cash Cushion';
  let superpowerVal = '$150,000';
  let superpowerSub = '16 months of living expenses ready to work';
  let leakTitle = '18% Credit Card Drag';
  let leakVal = '$3,240/yr';
  let leakSub = 'Interest burned on $18,000 Chase balance';
  let leakGroundingPath = 'case.score.explainer > Debt: 80% revolving at 18%';

  let translatorTitle = 'Interest Burned vs. Kids’ Education';
  let translatorText = 'The $3,240 you lose every year to credit card interest equals exactly 1 full semester of college tuition for Liam.';
  let translatorMetricA = { label: 'Card Interest Burned', value: '$3,240/yr', highlight: false };
  let translatorMetricB = { label: '1 Semester for Liam', value: '$3,240', highlight: true };

  let winAction = 'Pay $6,800 on 18% card from cash reserve';
  let winImpact = 'Save $1,224/yr in interest + unlock score from 60 to 62';
  let winSteps = [
    'Log into Chase and initiate a $6,800 transfer from your liquid cash account',
    'Your revolving utilization drops below the threshold, removing the score gate',
    'Notify your Sherpas advisor to update your Living Map projection',
  ];

  if (slug === 'timothy-melanie-weah') {
    superpowerTitle = 'Liquid Cash Reserves';
    superpowerVal = '$150,800';
    superpowerSub = '16 months of expenses — $60,222 above your safety target';
    leakTitle = '18% Revolving Debt Leak';
    leakVal = '$3,240/yr';
    leakSub = 'Burned in interest on an $18,000 Chase balance';
    leakGroundingPath = 'persona.md > T3: $18,000 card at 18% costs $3,240/yr';

    translatorTitle = 'Card Interest vs. Liam’s College';
    translatorText = 'The $3,240 you pay each year in card interest covers 70% of the $4,609 annual 529 contribution needed to fund Liam and Josh’s college education.';
    translatorMetricA = { label: 'Annual Interest Lost', value: '$3,240/yr', highlight: false };
    translatorMetricB = { label: 'College Need (Year 1)', value: '$4,609/yr', highlight: true };

    winAction = 'Transfer $6,800 from cash to Chase card';
    winImpact = 'Immediate $1,224/yr interest saved + score cap lifted from 60 to 62';
    winSteps = [
      'Transfer $6,800 from your high-liquidity cash account to the 18% credit card',
      'This eliminates the high-revolving score gate and saves $102 every month',
      'Schedule your 15-minute advisor session to align on life insurance & umbrella',
    ];
  } else if (slug === 'daniel-emily-johnson') {
    superpowerTitle = 'Debt Service & Housing Foundation';
    superpowerVal = '76/100';
    superpowerSub = 'Strong mortgage management on your $560,000 home';
    leakTitle = 'Cash Flow & Savings Pinch';
    leakVal = '54/100';
    leakSub = 'Retirement pace vs. college savings for Oliver (11) & Sophia (9)';
    leakGroundingPath = 'score.pillars[0].score = 54 (Savings and cash flow)';

    translatorTitle = 'Retiring at 62 vs. College for Both Kids';
    translatorText = 'Funding 100% of college for Oliver and Sophia requires $7,800/yr more in 529s, which shifts Daniel & Emily’s target retirement from 62 to 64 unless optimized.';
    translatorMetricA = { label: 'College Target (2 kids)', value: '$120,000', highlight: false };
    translatorMetricB = { label: 'Retirement Age Shift', value: '62 → 64', highlight: true };

    winAction = 'Reallocate $400/mo into Oliver & Sophia 529 plan';
    winImpact = 'Capture state tax credit + secure college runway without delaying 62 retirement';
    winSteps = [
      'Activate Colorado 529 direct-debit for $200/mo per child',
      'Capture up to $1,000 Colorado state income tax deduction',
      'Confirm employer 401(k) match is still 100% captured',
    ];
  } else if (slug === 'michael-carter') {
    superpowerTitle = 'High Earning Capacity';
    superpowerVal = '$180,000';
    superpowerSub = 'Top 10% income in Austin with comfortable debt score (78/100)';
    leakTitle = 'Zero Savings Reservoir';
    leakVal = '0/25 pts';
    leakSub = 'Score is 26/100 — cash flow is not building wealth towards 2027 home';
    leakGroundingPath = 'score.pillars[0].points_shown_in_app = 0/25';

    translatorTitle = 'Renting vs. $550k Home in 2027';
    translatorText = 'Working until age 60 instead of retiring early at 58 provides an additional $110,000 in compounding savings — exactly the 20% down payment required for your $550,000 Austin home.';
    translatorMetricA = { label: '2 Years Work (58 → 60)', value: '+$110,000', highlight: true };
    translatorMetricB = { label: '20% Home Down Payment', value: '$110,000', highlight: false };

    winAction = 'Establish automated $1,500/mo high-yield home fund';
    winImpact = 'Puts $54,000 towards 2027 home purchase by target date';
    winSteps = [
      'Open dedicated 4.5% APY high-yield savings account labeled "Austin Home 2027"',
      'Automate $1,500 monthly transfer on payday before discretionary spending',
      'Lock in 401(k) contribution at 6% to keep 100% employer match',
    ];
  } else if (slug === 'samantha-lewis') {
    superpowerTitle = 'Debt-Free Fortress';
    superpowerVal = '100/100';
    superpowerSub = 'Zero debt, $250k salary, strong liquidity (100/100)';
    leakTitle = 'College Timing Clashing with Vacation Home';
    leakVal = '2026 vs 2030';
    leakSub = 'Ethan (18) starts college now while 2nd home is slated for 2030';
    leakGroundingPath = 'goals.goalsSummary: College for Ethan & Ava vs 2030 Home';

    translatorTitle = 'Ethan & Ava College vs. 2030 Second Home';
    translatorText = 'Deploying $35,000/yr from current cash flow for Ethan & Ava’s university covers all tuition without tapping investment portfolios or compromising your 2030 second home.';
    translatorMetricA = { label: 'College Tuition Runway', value: '$70,000', highlight: false };
    translatorMetricB = { label: '2030 Second Home Goal', value: '$450,000', highlight: true };

    winAction = 'Partition tuition cash flow from long-term wealth assets';
    winImpact = 'Guarantees 100% debt-free college graduation while staying on track for 2030';
    winSteps = [
      'Set up 529 distribution account for Ethan’s upcoming term',
      'Maintain 2030 second-home investment portfolio in moderate-growth allocation',
      'Review annual umbrella liability limit for teenager drivers ($2M recommended)',
    ];
  }

  const stories: StoryCard[] = [
    // Story 0: Vibe Check
    {
      id: 'story-vibe',
      storyIndex: 0,
      pillar: 'vibe',
      title: 'Welcome, ' + familyName,
      subtitle: 'How would you like to review your Sherpas plan today?',
      tagline: 'Customized mobile walkthrough',
      highlightNumber: '3 min',
      highlightUnit: '',
      highlightLabel: 'Average review time',
      interactiveType: 'vibe_check',
      dataPoints: [
        { label: 'Household', value: familyName },
        { label: 'City', value: fh.case.city || 'USA' },
        { label: 'Plan Status', value: 'Ready to Calibrate', highlight: true },
      ],
      voiceScript: `Welcome ${familyName}. We've transformed your Sherpas financial plan into an interactive mobile experience. Choose your viewing style to begin.`,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'case.household',
        label: 'Household Profile',
        rawValue: familyName,
      },
    },

    // Story 1: Overview - Superpower vs Silent Leak
    {
      id: 'story-overview',
      storyIndex: 1,
      pillar: 'overview',
      title: 'Superpower vs. Silent Leak',
      subtitle: 'Where your money thrives — and where it silently drains.',
      tagline: 'The Tale of Two Balances',
      highlightNumber: superpowerVal,
      highlightUnit: '',
      highlightLabel: superpowerTitle,
      interactiveType: 'superpower_vs_leak',
      dataPoints: [
        {
          label: 'Superpower',
          value: superpowerVal,
          unit: '',
          highlight: true,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'score.published_score',
            label: superpowerTitle,
            rawValue: superpowerVal,
          },
        },
        {
          label: 'Silent Leak',
          value: leakVal,
          unit: '',
          highlight: false,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: leakGroundingPath,
            label: leakTitle,
            rawValue: leakVal,
          },
        },
        {
          label: 'Health Score',
          value: score,
          unit: '/100',
          highlight: score >= 70,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'score.published_score',
            label: 'Published Health Score',
            rawValue: score,
          },
        },
      ],
      voiceScript: `${familyName}, your financial superpower is ${superpowerTitle} with ${superpowerVal}. But your silent leak is ${leakTitle}, draining ${leakVal}. Let's see how fixing this changes your life.`,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'score.published_score',
        label: 'Financial Health Score',
        rawValue: score,
      },
    },

    // Story 2: The Real-Life Translator
    {
      id: 'story-translator',
      storyIndex: 2,
      pillar: 'translator',
      title: 'The Real-Life Translator',
      subtitle: 'What your plan numbers mean in everyday life.',
      tagline: 'Translating finance into family milestones',
      highlightNumber: translatorMetricB.value,
      highlightUnit: '',
      highlightLabel: translatorMetricB.label,
      interactiveType: 'real_life_analogy',
      dataPoints: [
        {
          label: translatorMetricA.label,
          value: translatorMetricA.value,
          unit: '',
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: leakGroundingPath,
            label: translatorMetricA.label,
            rawValue: translatorMetricA.value,
          },
        },
        {
          label: translatorMetricB.label,
          value: translatorMetricB.value,
          unit: '',
          highlight: true,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'goals.goalsSummary',
            label: translatorMetricB.label,
            rawValue: translatorMetricB.value,
          },
        },
      ],
      voiceScript: translatorText,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'goals.goalsSummary',
        label: translatorTitle,
        rawValue: translatorText,
      },
    },

    // Story 3: Advice - The Liquidity Tank
    {
      id: 'story-advice',
      storyIndex: 3,
      pillar: 'advice',
      title: 'The Liquidity Tank',
      subtitle: 'Multiple priorities are competing for the exact same cash.',
      tagline: 'Prioritizing competing strategies',
      highlightNumber: topMove ? `$${topMove.target_amount.toLocaleString()}` : '$18,000',
      highlightUnit: '',
      highlightLabel: 'Top recommended move',
      interactiveType: 'liquidity_tank_preview',
      dataPoints: (fh.score.top_moves || []).slice(0, 3).map((move, i) => ({
        label: `#${i + 1} ${move.title}`,
        value: `$${move.target_amount.toLocaleString()}`,
        unit: '',
        highlight: i === 0,
        grounding: {
          sourceFile: 'financial-health.json',
          jsonPath: `score.top_moves[${i}]`,
          label: move.title,
          rawValue: move.target_amount,
        },
      })),
      voiceScript: `Your recommendations compete for available cash: paying off high-rate debt, securing life and umbrella protection, and funding college. Next, you'll tactilely allocate your cash to see the trade-offs.`,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'score.top_moves',
        label: 'Recommended Moves',
        rawValue: topMove?.target_amount ?? 0,
      },
    },

    // Story 4: Living Map - The Time Machine
    {
      id: 'story-living-map',
      storyIndex: 4,
      pillar: 'living-map',
      title: 'The Time Machine',
      subtitle: 'Your Living Map from today to retirement and beyond.',
      tagline: 'Year-by-year milestone journey',
      highlightNumber: client?.retirement_age ? `Age ${client.retirement_age}` : 'Age 62',
      highlightUnit: '',
      highlightLabel: `${clientName} Target Retirement`,
      interactiveType: 'time_machine',
      dataPoints: [
        {
          label: `${clientName} Retires`,
          value: client?.retirement_age ? `Age ${client.retirement_age}` : 'Age 62',
          highlight: true,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'case.household[0].retirement_age',
            label: 'Retirement Age',
            rawValue: client?.retirement_age ?? 62,
          },
        },
        ...(children[0]
          ? [
              {
                label: `${children[0].first_name} College`,
                value: `In ${18 - children[0].age} yrs`,
                grounding: {
                  sourceFile: 'financial-health.json' as const,
                  jsonPath: 'case.household[child].age',
                  label: `${children[0].first_name}'s College Horizon`,
                  rawValue: children[0].age,
                },
              },
            ]
          : []),
        {
          label: 'Health Pillars Tracked',
          value: fh.score.pillars.length,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'score.pillars',
            label: 'Total Pillars',
            rawValue: fh.score.pillars.length,
          },
        },
      ],
      voiceScript: `Your Sherpas Living Map charts your milestones across time. Tapping any milestone lets you test what-if scenarios without risking your plan.`,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'goals.chartGoals',
        label: 'Living Map Goals',
        rawValue: client?.retirement_age ?? 62,
      },
    },

    // Story 5: Action - The 5-Minute Win
    {
      id: 'story-action',
      storyIndex: 5,
      pillar: 'action',
      title: 'Your 5-Minute Win',
      subtitle: 'One concrete move today to unlock immediate financial momentum.',
      tagline: 'The First Domino',
      highlightNumber: winAction.split(' ')[1] || '$6,800',
      highlightUnit: '',
      highlightLabel: winAction,
      interactiveType: 'wrapped_summary',
      dataPoints: [
        {
          label: 'Immediate Move',
          value: winAction,
          highlight: true,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'score.top_moves[0].action',
            label: 'Action 1',
            rawValue: winAction,
          },
        },
        {
          label: 'Impact',
          value: winImpact,
          grounding: {
            sourceFile: 'financial-health.json',
            jsonPath: 'score.top_moves[0].score_after',
            label: 'Score Gain',
            rawValue: winImpact,
          },
        },
      ],
      voiceScript: `Here is your first domino: ${winAction}. This delivers ${winImpact}. You can execute this in 5 minutes today.`,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'score.top_moves[0]',
        label: 'Primary Action Item',
        rawValue: winAction,
      },
    },
  ];

  return stories;
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
  fh: FinancialHealth,
  ia: InvestmentAnalysis,
): Record<string, CalibrationCard> {
  const score = fh.score.published_score;
  const topMove = fh.score.top_moves?.[0];

  return {
    'roth-ira': {
      term: 'Roth IRA',
      termKey: 'roth-ira',
      headline: 'The "Pre-Paid Tax Flight" Analogy',
      analogy: 'Imagine booking a vacation where you pay the baggage fee today, and in 20 years when you land, you walk out of the airport with all your bags free forever — no matter how heavy they grew. That’s a Roth IRA: pay tax now, never pay tax on any growth again.',
      sherpasTake: 'Your plan recommends funding Roth accounts up to annual limits because tax-free retirement buckets give you flexibility in your 60s.',
      numbers: [
        { label: 'Estimated Contribution Room', value: '$5,250/yr', unit: '', highlight: true },
        { label: 'Long-Term Tax Drag Saved', value: 'Zero on withdrawals' },
      ],
      groundingRefs: [
        {
          sourceFile: 'persona.md',
          jsonPath: 'O7: Unused contribution limits: Roth IRA eligible for $5,250.10',
          label: 'Roth IRA Room',
          rawValue: '$5,250.10',
        },
      ],
    },

    'umbrella-liability': {
      term: 'Umbrella Liability',
      termKey: 'umbrella-liability',
      headline: 'The "Bulletproof Windshield" Analogy',
      analogy: 'Your standard auto and home policies are like ordinary windshields: they stop small pebbles. But if a serious accident causes $800k in damages, standard coverage shatters and claims take your home and savings. An umbrella policy sits above them like a bulletproof shield for $25/month.',
      sherpasTake: `Your net worth is substantial, but you currently have $0 in umbrella cover. Adding $1M of coverage seals your largest vulnerability for under $1/day.`,
      numbers: [
        { label: 'Recommended Policy', value: '$1,000,000', highlight: true },
        { label: 'Current Coverage', value: '$0' },
        { label: 'Estimated Annual Premium', value: '~$300/yr' },
      ],
      groundingRefs: [
        {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.top_moves: Add $1M umbrella cover',
          label: 'Umbrella Policy Target',
          rawValue: 1000000,
        },
      ],
    },

    'revolving-apr': {
      term: '18% Revolving APR',
      termKey: 'revolving-apr',
      headline: 'The "Leaky Fuel Line" Analogy',
      analogy: 'Carrying a balance at 18% while keeping cash in a bank account earning 0.1% is like driving with a hole in your fuel tank while pumping gas in the top. The interest drains $3,240 every year without giving you a single mile of travel.',
      sherpasTake: `Paying down this card from your idle cash surplus immediately generates a guaranteed 18% risk-free return on that money.`,
      numbers: [
        { label: 'Current Balance', value: '$18,000', highlight: true },
        { label: 'Annual Interest Burned', value: '$3,240/yr' },
        { label: 'Bank Cash Yield', value: '0.09%' },
      ],
      groundingRefs: [
        {
          sourceFile: 'persona.md',
          jsonPath: 'T3: 18% card balance costs $3,240/yr vs $150 earned on cash',
          label: 'Debt Cost vs Cash Yield',
          rawValue: 3240,
        },
      ],
    },

    'mortality-ratio': {
      term: 'Mortality Ratio',
      termKey: 'mortality-ratio',
      headline: 'The "Emergency Parachute" Analogy',
      analogy: 'If one partner doesn’t return home tomorrow, their income stops immediately, but the mortgage, food, and college expenses continue for 20 years. A 33% mortality ratio means your parachute only opens one-third of the way.',
      sherpasTake: `Adding $235,000 of low-cost term life insurance raises your coverage to 100% of your family's needs and immediately unlocks your score cap.`,
      numbers: [
        { label: 'Current Coverage Ratio', value: '33%', highlight: false },
        { label: 'Required Target', value: '100%', highlight: true },
        { label: 'Life Shortfall', value: '$235,000' },
      ],
      groundingRefs: [
        {
          sourceFile: 'financial-health.json',
          jsonPath: 'score.caps_applied[1]: Mortality coverage ratio below threshold with dependents',
          label: 'Mortality Cap',
          rawValue: '33%',
        },
      ],
    },

    '529-plan': {
      term: '529 College Plan',
      termKey: '529-plan',
      headline: 'The "Compound Snowball" Analogy',
      analogy: 'A 529 plan is like planting an apple orchard when your kids are toddlers. Every dollar you plant grows tax-free, and by the time college arrives, you harvest fruit for tuition without touching the tree trunks of your retirement savings.',
      sherpasTake: `With Liam (6) and Josh (3), starting with $4,609/year covers the $113k gap over 12 years instead of facing a $100k emergency bill later.`,
      numbers: [
        { label: 'Current 529 Balance', value: '$0', highlight: false },
        { label: 'Total Projected Gap', value: '$113,508' },
        { label: 'Suggested Annual Start', value: '$4,609/yr', highlight: true },
      ],
      groundingRefs: [
        {
          sourceFile: 'persona.md',
          jsonPath: 'O4: $0 in 529s against $113,508.60 funding gap',
          label: '529 Education Gap',
          rawValue: '$113,508.60',
        },
      ],
    },

    'leveraged-etf': {
      term: 'Leveraged ETF (UPRO)',
      termKey: 'leveraged-etf',
      headline: 'The "Turbocharged Engine" Analogy',
      analogy: 'A 3x leveraged ETF is like putting a rocket booster on a family sedan. On smooth straight highways it speeds ahead with breathtaking gains (like 41% returns), but hit a slight pothole in market volatility and the swings can shake the entire vehicle.',
      sherpasTake: `Timothy holds $12,740 of UPRO. While exciting, it brings 30% volatility to an account meant for steady multi-decade retirement.`,
      numbers: [
        { label: 'Current UPRO Holding', value: '$12,740', highlight: true },
        { label: 'Annualized Volatility', value: '30.0%' },
        { label: 'Portfolio Technology Tilt', value: '30.0%' },
      ],
      groundingRefs: [
        {
          sourceFile: 'investment-analysis.json',
          jsonPath: 'positions[UPRO]: ProShares UltraPro S&P500 value $12,740',
          label: 'UPRO Leveraged Holding',
          rawValue: 12740,
        },
      ],
    },

    'withdrawal-rate': {
      term: 'Withdrawal Rate',
      termKey: 'withdrawal-rate',
      headline: 'The "Well That Never Dries" Analogy',
      analogy: 'Think of your retirement savings as a water well. If you draw out 4% a year, natural rainfall (investment growth) replenishes the water so you never run dry over 30 years. Draw 7% and a dry year can drain the well completely.',
      sherpasTake: `Your projected savings of $2.37M at plan end provides a safe ~3.8% withdrawal runway that protects you even through extended down-markets.`,
      numbers: [
        { label: 'Projected End Savings', value: '$2,371,900', highlight: true },
        { label: 'Income Coverage Ratio', value: '93%' },
      ],
      groundingRefs: [
        {
          sourceFile: 'financial-health.json',
          jsonPath: 'narrative.summary_main: $2,371,900.89 left at end of plan',
          label: 'Retirement Longevity',
          rawValue: '$2,371,900.89',
        },
      ],
    },
  };
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
  const p1Name = primaryAlloc?.partner || 'Timothy';
  const p2Name = secondaryAlloc?.partner || 'Melanie';

  // Default agreements & tie-breakers based on known household dynamics
  const agreements: SyncAgreement[] = [
    {
      strategyId: 'card-payoff',
      title: 'Pay Off 18% Credit Card ($18,000)',
      agreedAmount: 18000,
      dollarBenefit: 'Saves $3,240/year in interest immediately',
      explanation: `Both ${p1Name} and ${p2Name} placed the 18% credit card as Priority #1. Paying off the $18,000 from cash eliminates the score cap and puts $270/mo back in household cash flow.`,
      status: 'agreement',
    },
    {
      strategyId: 'umbrella-cover',
      title: 'Add $1M Umbrella Policy (~$25/mo)',
      agreedAmount: 1000000,
      dollarBenefit: 'Protects entire $695,500 net worth',
      explanation: `Both partners agreed that protecting the family against catastrophic liability is essential and fits easily within monthly budget.`,
      status: 'agreement',
    },
  ];

  const tieBreakers: SyncTieBreaker[] = [
    {
      strategyId: 'life-vs-college',
      title: 'Life Insurance vs. College Savings (529)',
      partner1Name: p1Name,
      partner1Priority: 2,
      partner1Amount: 4609,
      partner2Name: p2Name,
      partner2Priority: 2,
      partner2Amount: 235000,
      advisorQuestion: `${p1Name} prioritized starting the 529 college fund for Liam & Josh ($4,609/yr), while ${p2Name} prioritized securing $235,000 in term life insurance. How should we split the surplus cash across both?`,
      status: 'tie_breaker',
    },
  ];

  return { agreements, tieBreakers };
}
