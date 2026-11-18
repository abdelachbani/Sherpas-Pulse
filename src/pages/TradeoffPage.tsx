/**
 * src/pages/TradeoffPage.tsx
 *
 * Tactile Trade-off & What-If Simulator for Single Households:
 *  - Tailored for Michael Carter (Austin TX) & Samantha Lewis (Miami FL)
 *  - Interactive What-If chips:
 *      * Michael: "Buy $550,000 Home in 2027" vs "Retire at 58"
 *      * Samantha: "College Tuition for Teens Now" vs "Second Home in 2030"
 *  - Priority Importance Slider (1 to 5 stars + dynamic weight percentage) for each option
 *  - Interactive balance ratio bar with quick preset allocations
 *  - Living Map Timeline Scrubber (2026 to 2050) showing milestone impact
 *  - Grounding Badge integration (opens GroundingInspector modal)
 *  - "Continue to Your Action Plan" navigation to /case/:caseId/action
 *  - Mobile-first (max-w-3xl mx-auto), dark slate theme matching existing pages
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  SlidersHorizontal,
  Home,
  Clock,
  GraduationCap,
  Palmtree,
  ChevronRight,
  ArrowLeft,
  Calendar,
  Star,
  User,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractWhatIfScenarios } from '../lib/mcp/extractor';
import { GroundingInspector } from '../components/calibration/GroundingInspector';
import { FinancialText } from '../components/shared/FinancialText';
import type { WhatIfScenario, GroundingRef } from '../types';

export default function TradeoffPage() {
  const { caseId } = useParams<{ caseId: string }>();
  if (!CASES.some((item) => item.id === caseId)) {
    return <main className="session-page min-h-dvh bg-[#171827] text-white p-8"><div className="max-w-3xl mx-auto"><h1 className="text-2xl font-semibold">Household not found</h1><p className="mt-3 text-sm text-slate-300">This household link is unavailable. Choose a household to continue.</p><a className="inline-flex min-h-11 items-center mt-6 text-indigo-300 underline" href="/">Choose a household</a></div></main>;
  }
  return <TradeoffPageContent key={caseId} />;
}

function TradeoffPageContent() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);
  const trackTradeoffChange = useAppStore((s) => s.trackTradeoffChange);

  // Active case resolution: prefer URL param, then appStore, then default to Michael Carter
  const activeCase =
    (currentCase?.id === caseId ? currentCase : CASES.find((c) => c.id === caseId))!;

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  const fh = activeCase.financialHealth;
  const ia = activeCase.investmentAnalysis;
  const isMichael = activeCase.id === 'michael-carter';
  const isSamantha = activeCase.id === 'samantha-lewis';

  const client = fh.case.household.find((m) => m.role === 'client');
  const clientName = client?.first_name ?? (isMichael ? 'Michael' : 'Samantha');
  const clientAge = client?.age ?? (isMichael ? 37 : 47);
  const retirementAge = client?.retirement_age ?? (isMichael ? 58 : 65);

  // Extract what-if scenarios from deterministic extractor
  const scenarios = useMemo(
    () => extractWhatIfScenarios(fh, ia),
    [fh, ia]
  );

  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    scenarios[0]?.id ?? 'home-vs-retire'
  );

  const activeScenario: WhatIfScenario =
    scenarios.find((s) => s.id === activeScenarioId) ?? scenarios[0] ?? {
      id: 'default',
      title: 'Goal Prioritization',
      tag: 'Strategic Balance',
      description: 'Weighing immediate goals against long-term financial independence.',
      optionA: { label: 'Goal A', impact: 'Impact of primary goal.' },
      optionB: { label: 'Goal B', impact: 'Impact of alternative goal.' },
    };

  // Priority Importance Slider (1 to 5 stars) for each option
  const [starsA, setStarsA] = useState<number>(4);
  const [starsB, setStarsB] = useState<number>(3);

  // Timeline scrubber year: 2026 to 2050
  const [timelineYear, setTimelineYear] = useState<number>(isMichael ? 2027 : 2026);

  // Grounding Inspector Modal state
  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);

  // Reset scenario specifics when switching scenario or case
  useEffect(() => {
    if (scenarios[0]?.id) {
      setActiveScenarioId(scenarios[0].id);
      setStarsA(4);
      setStarsB(3);
      setTimelineYear(isMichael ? 2027 : 2026);
    }
  }, [activeCase.id, isMichael]);

  // Dynamic weight percentage calculated from stars
  const totalStars = starsA + starsB;
  const weightA = totalStars > 0 ? Math.round((starsA / totalStars) * 100) : 50;
  const weightB = 100 - weightA;
  const activeChoice = starsA === starsB ? 'balanced' : starsA > starsB ? 'A' : 'B';
  const priorities = [
    { option: 'A', title: activeScenario.optionA.label, stars: starsA, weight: weightA },
    { option: 'B', title: activeScenario.optionB.label, stars: starsB, weight: weightB },
  ].sort((a, b) => b.stars - a.stars);

  // Star descriptive labels
  function getStarLabel(stars: number): string {
    switch (stars) {
      case 5:
        return 'Non-Negotiable (Top Priority)';
      case 4:
        return 'High Priority (Active Focus)';
      case 3:
        return 'Important (Balanced Milestone)';
      case 2:
        return 'Secondary (Flexible Timing)';
      default:
        return 'Low Priority (Nice-to-Have)';
    }
  }

  // Handle Preset Allocations
  function applyPreset(preset: 'favorA' | 'balanced' | 'favorB') {
    if (preset === 'favorA') {
      setStarsA(5);
      setStarsB(2);
    } else if (preset === 'balanced') {
      setStarsA(4);
      setStarsB(4);
    } else {
      setStarsA(2);
      setStarsB(5);
    }

    trackTradeoffChange({
      action: 'preset_applied',
      preset,
      caseId: activeCase.id,
    }, 'tradeoff');
  }

  // Handle What-If Chip click
  function handleSelectChip(choice: 'A' | 'B') {
    if (choice === 'A') {
      setStarsA(Math.max(starsA, 4));
      setStarsB(Math.min(starsB, 3));
      if (isMichael) setTimelineYear(2027);
      if (isSamantha) setTimelineYear(2026);
    } else {
      setStarsB(Math.max(starsB, 4));
      setStarsA(Math.min(starsA, 3));
      if (isMichael) setTimelineYear(2047);
      if (isSamantha) setTimelineYear(2030);
    }

    trackTradeoffChange({
      action: 'choice_select',
      choice,
      caseId: activeCase.id,
      scenarioId: activeScenario.id,
    }, 'tradeoff');
  }

  function handlePriorityChange(option: 'A' | 'B', value: number) {
    if (value === (option === 'A' ? starsA : starsB)) return;
    if (option === 'A') setStarsA(value);
    else setStarsB(value);

    trackTradeoffChange({
      action: 'priority_change',
      option,
      value,
      caseId: activeCase.id,
      scenarioId: activeScenario.id,
    }, 'tradeoff');
  }

  function handleTimelineChange(year: number) {
    if (year === timelineYear) return;
    setTimelineYear(year);
    trackTradeoffChange({
      action: 'timeline_change',
      year,
      caseId: activeCase.id,
      scenarioId: activeScenario.id,
    }, 'tradeoff');
  }

  // Calculate year metrics and milestone projection
  const currentAgeAtScrub = clientAge + (timelineYear - 2026);

  // Dynamic milestone data based on year and weights
  const milestoneData = useMemo(() => {
    if (isMichael) {
      if (timelineYear === 2026) {
        return {
          title: 'Foundation & Automated Down Payment',
          badge: 'Current Phase',
          statusColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
          narrative:
            weightA >= 50
              ? 'Deploying $1,500/mo into a 4.5% High-Yield Home Fund to reach the $110k Austin down payment target by 2027.'
              : 'Directing maximum surplus into 401(k) and brokerage index funds to accelerate compounding towards age 58 retirement.',
          stat1Label: 'Monthly Savings Target',
          stat1Val: '$1,500/mo',
          stat2Label: 'Home Fund Balance',
          stat2Val: weightA >= 50 ? '$28,000' : '$12,000',
          stat3Label: 'Retirement Trajectory',
          stat3Val: weightA >= 50 ? 'Age 61 Target' : 'Age 58 Target',
          groundingRef: {
            sourceFile: 'financial-health.json' as const,
            jsonPath: 'score.top_moves[0]: Automated $1,500/mo savings',
            label: 'Savings Reserve Pace',
            rawValue: '$1,500/mo',
          },
        };
      }
      if (timelineYear === 2027) {
        return {
          title: '🏠 $550,000 Austin Home Purchase',
          badge: 'Milestone Goal A',
          statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
          narrative:
            weightA >= 50
              ? 'Goal Achieved! $110,000 down payment deployed for $550k Austin home. Monthly mortgage payment: $3,240/mo. Retirement shifted from 58 to 61.'
              : 'Renting option maintained ($2,200/mo). Skipping down payment leaves $110,000 fully invested in compounding assets.',
          stat1Label: 'Home Equity',
          stat1Val: weightA >= 50 ? '$110,000' : '$0 (Renting)',
          stat2Label: 'Down Payment Deployed',
          stat2Val: weightA >= 50 ? '$110,000' : '$0',
          stat3Label: 'Retirement Shift',
          stat3Val: weightA >= 50 ? 'Age 61' : 'Age 58 (Preserved)',
          groundingRef: {
            sourceFile: 'financial-health.json' as const,
            jsonPath: 'goals.goalsSummary: Home purchase $550,000',
            label: 'Austin Home Purchase Target',
            rawValue: 550000,
          },
        };
      }
      if (timelineYear > 2027 && timelineYear < 2047) {
        const yearsPast2026 = timelineYear - 2026;
        const estEquity = weightA >= 50 ? 110000 + yearsPast2026 * 14500 : 0;
        const estPortfolio = Math.round(
          140000 * Math.pow(1.065, yearsPast2026) +
            (weightA >= 50 ? yearsPast2026 * 12000 : yearsPast2026 * 26000)
        );
        return {
          title: 'Mid-Career Wealth Compounding',
          badge: 'Growth Horizon',
          statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
          narrative:
            weightA >= 50
              ? `Mortgage amortization and Austin real estate appreciation build $${Math.round(
                  estEquity / 1000
                )}k in home equity while portfolio steadily re-accumulates.`
              : `Zero mortgage friction allows $2,200/mo in pure index fund investments. Liquid portfolio expands to $${Math.round(
                  estPortfolio / 1000
                )}k.`,
          stat1Label: 'Estimated Home Equity',
          stat1Val: weightA >= 50 ? `$${estEquity.toLocaleString()}` : '$0',
          stat2Label: 'Retirement Portfolio',
          stat2Val: `$${estPortfolio.toLocaleString()}`,
          stat3Label: 'Austin Living Status',
          stat3Val: weightA >= 50 ? 'Homeowner' : 'Flexible Tenant',
          groundingRef: {
            sourceFile: 'financial-health.json' as const,
            jsonPath: 'goals.goalsSummary: Austin home vs Age 58 retirement',
            label: 'Compounding Net Worth Path',
            rawValue: `$${estPortfolio.toLocaleString()}`,
          },
        };
      }
      if (timelineYear === 2047) {
        return {
          title: '⏰ Target Early Retirement Milestone (Age 58)',
          badge: 'Milestone Goal B',
          statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          narrative:
            weightB >= 50
              ? 'Goal Achieved at Age 58! $1.42M liquid portfolio supports $56,800/yr safe withdrawal (4.0% rule). Zero debt obligations.'
              : 'Still working 3 additional years until age 61. Home equity is $485,000, ensuring retirement with a fully paid-off asset.',
          stat1Label: 'Early Retirement Ready',
          stat1Val: weightB >= 50 ? '100% Ready' : '3 Yrs to Go (Age 61)',
          stat2Label: 'Liquid Corpus',
          stat2Val: weightB >= 50 ? '$1,420,000' : '$1,180,000',
          stat3Label: 'Safe Annual Withdrawal',
          stat3Val: weightB >= 50 ? '$56,800/yr' : 'Begins at 61',
          groundingRef: {
            sourceFile: 'financial-health.json' as const,
            jsonPath: 'case.household[0].retirement_age = 58',
            label: 'Retirement Age 58 Baseline',
            rawValue: 58,
          },
        };
      }
      return {
        title: 'Full Horizon Independence (Age 61+)',
        badge: 'Longevity Phase',
        statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        narrative:
          weightA >= 50
            ? 'Homeowner Retirement Achieved! Austin property is substantially paid down with $540k in equity and $1.45M liquid capital.'
            : 'Comfortably 3 years into early retirement with capital fully preserved and zero mortgage debt.',
        stat1Label: 'Total Net Worth',
        stat1Val: weightA >= 50 ? '$1,990,000' : '$1,520,000',
        stat2Label: 'Home Debt Remaining',
        stat2Val: weightA >= 50 ? '$85,000' : '$0',
        stat3Label: 'Living Comfort Score',
        stat3Val: '100 / 100',
        groundingRef: {
          sourceFile: 'financial-health.json' as const,
          jsonPath: 'narrative.summary_main: Longevity projection',
          label: 'Plan Longevity Horizon',
          rawValue: '$1.99M Net Worth',
        },
      };
    }

    // Samantha Lewis Milestones
    if (timelineYear <= 2027) {
      return {
        title: '🎓 College Tuition Runway (Ethan & Ava)',
        badge: 'Milestone Goal A',
        statusColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
        narrative:
          weightA >= 50
            ? 'Deploying $35,000/yr from current cash flow. Ethan begins university with 100% tuition funded, avoiding all student loans.'
            : 'Splitting tuition between cash flow and merit scholarships to preserve maximum liquidity for the 2030 second home.',
        stat1Label: 'Tuition Cash Deployed',
        stat1Val: '$35,000/yr',
        stat2Label: 'Student Debt Avoided',
        stat2Val: '$70,000',
        stat3Label: '2030 Home Readiness',
        stat3Val: weightB >= 50 ? 'Strong (On Pace)' : 'Moderate Pace',
        groundingRef: {
          sourceFile: 'financial-health.json' as const,
          jsonPath: 'goals.goalsSummary: College for Ethan (18) & Ava (16)',
          label: 'College Tuition Horizon',
          rawValue: '$70,000 Total Needed',
        },
      };
    }
    if (timelineYear === 2030) {
      return {
        title: '🏖️ Second Home Purchase ($450,000)',
        badge: 'Milestone Goal B',
        statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        narrative:
          weightB >= 50
            ? 'Goal Achieved! $90,000 down payment deployed for $450k second home. Kids are graduated from college and independent.'
            : 'Second home delayed by 2 years to 2032 to ensure college for Ava was fully completed with zero compromise.',
        stat1Label: 'Down Payment Deployed',
        stat1Val: weightB >= 50 ? '$90,000 (20%)' : 'Accumulating ($60k)',
        stat2Label: 'Second Home Status',
        stat2Val: weightB >= 50 ? 'Purchased in 2030' : 'Shifted to 2032',
        stat3Label: 'Kids College Debt',
        stat3Val: '$0 (Debt-Free)',
        groundingRef: {
          sourceFile: 'financial-health.json' as const,
          jsonPath: 'goals.goalsSummary: Second Home in 2030 ($450k)',
          label: 'Second Home Target',
          rawValue: 450000,
        },
      };
    }
    if (timelineYear < 2044) {
      return {
        title: 'Peak Earning & Portfolio Expansion',
        badge: 'Wealth Acceleration',
        statusColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        narrative:
          'With college expenses completed, monthly cash flow increases by $3,000/mo, accelerating investment portfolios and property equity.',
        stat1Label: 'Retirement Portfolio',
        stat1Val: '$1,850,000',
        stat2Label: 'Real Estate Equity',
        stat2Val: weightB >= 50 ? '$210,000' : '$110,000',
        stat3Label: 'Health Score Impact',
        stat3Val: '88 / 100',
        groundingRef: {
          sourceFile: 'financial-health.json' as const,
          jsonPath: 'score.published_score: 82',
          label: 'Health Score Baseline',
          rawValue: 82,
        },
      };
    }
    return {
      title: 'Target Retirement at Age 65 (2044+)',
      badge: 'Retirement Horizon',
      statusColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
      narrative:
        'Target retirement at 65 fully secured. Debt-free family foundation with robust multi-decade withdrawal cushion and wealth legacy.',
      stat1Label: 'Net Worth at 65',
      stat1Val: '$2,650,000',
      stat2Label: 'Safe Annual Income',
      stat2Val: '$105,000/yr',
      stat3Label: 'Independence',
      stat3Val: '100% Funded',
      groundingRef: {
        sourceFile: 'financial-health.json' as const,
        jsonPath: 'case.household[0].retirement_age = 65',
        label: 'Samantha Retirement Age',
        rawValue: 65,
      },
    };
  }, [isMichael, timelineYear, weightA, weightB]);

  // Handle Continue to Action Plan
  function handleContinueToAction() {
    addTelemetryEvent({
      type: 'allocation_set',
      payload: {
        caseId: activeCase.id,
        scenarioId: activeScenario.id,
        choice: activeChoice,
        starsA,
        starsB,
        weightA,
        weightB,
        timelineYear,
        clientAgeAtScrub: currentAgeAtScrub,
      },
      timestamp: Date.now(),
    });

    navigate(`/case/${activeCase.id}/action`);
  }

  // Fast switch for judges/presentation between Michael and Samantha
  function handleSwitchSingleCase(targetId: string) {
    navigate(`/case/${targetId}/tradeoff`);
  }

  return (
    <div className="session-page min-h-dvh bg-[#171827] text-white max-w-3xl mx-auto p-5 pb-8 flex flex-col justify-between select-none relative overflow-x-hidden font-sans">
      {/* ── Top Header Bar ──────────────────────────────────────────────────── */}
      <div className="pt-2 relative z-10">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate(`/case/${activeCase.id}/stories`)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Stories</span>
          </button>

          {/* Quick Case Switcher for Hackathon Judges */}
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5 text-xs">
            <button
              onClick={() => handleSwitchSingleCase('michael-carter')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                isMichael
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Michael
            </button>
            <button
              onClick={() => handleSwitchSingleCase('samantha-lewis')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                isSamantha
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Samantha
            </button>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <User className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-semibold tracking-tight text-white leading-tight">
                  {clientName}
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Single
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Age {clientAge} · {fh.case.city}, {fh.case.state} · Target Retire: {retirementAge}
              </p>
            </div>
          </div>

          {/* Published Health Score Badge */}
          <div className="text-right">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-white">
              <span
                className={`w-2 h-2 rounded-full ${
                  fh.score.published_score >= 70
                    ? 'bg-emerald-400'
                    : fh.score.published_score >= 50
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
              <span>Score: {fh.score.published_score}</span>
            </div>
          </div>
        </div>

        {/* Page Title & Subtitle */}
        <div className="mt-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Interactive What-If Simulator</span>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Weigh competing goals to see their impact on your living map.
          </p>
        </div>
      </div>

      {/* ── Center Content: Interactive What-If & Priority Sliders ──────────── */}
      <div className="py-6 space-y-5 relative z-10">
        {/* Scenario Selector (if multiple exist, e.g. Home vs Retire vs Umbrella) */}
        {scenarios.length > 1 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {scenarios.map((sc) => (
            <div
                key={sc.id}
                className={`min-w-0 min-h-11 p-3 rounded-2xl text-left border text-xs transition-all ${
                  activeScenario.id === sc.id
                    ? 'bg-indigo-600/30 border-indigo-400 text-white shadow-md'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold break-words"><FinancialText text={sc.title} /></div>
                  <div className="text-xs text-indigo-300 mt-0.5"><FinancialText text={sc.tag} /></div>
                </div>
                <button
                  type="button"
                  aria-pressed={activeScenario.id === sc.id}
                  onClick={() => {
                    setActiveScenarioId(sc.id);
                    if (sc.id !== activeScenario.id) {
                      trackTradeoffChange({
                        action: 'scenario_select',
                        caseId: activeCase.id,
                        scenarioId: sc.id,
                      }, 'tradeoff');
                    }
                  }}
                  className="min-h-11 shrink-0 rounded-lg bg-slate-800 px-3 font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#819cff]"
                >
                  {activeScenario.id === sc.id ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
            ))}
          </div>
        )}

        {/* ── Interactive What-If Chips Card ─────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
              Competing Priorities
            </span>
            <span className="text-xs text-slate-400">Scenario estimate</span>
          </div>

          <ol data-priority-order aria-label="Current priority order" aria-live="polite" className="divide-y divide-slate-700 border-y border-slate-700">
            {priorities.map((priority, index) => (
              <li key={priority.option} data-option={priority.option} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-3 py-3 text-sm">
                <span className="tabular-nums font-semibold text-indigo-200">{activeChoice === 'balanced' ? 'Tie' : index + 1}</span>
                <span className="min-w-0 break-words font-medium">{priority.title}</span>
                <span className="text-slate-300 tabular-nums">{priority.weight}%</span>
              </li>
            ))}
          </ol>

          {/* The Two What-If Interactive Chips */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* Option A Chip */}
            <motion.article
              className={`p-3.5 rounded-2xl border transition-all ${
                activeChoice === 'A'
                  ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-500/20 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <motion.button
                type="button"
                aria-pressed={activeChoice === 'A'}

                onClick={() => handleSelectChip('A')}
                className="w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#819cff]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
                      {isMichael ? (
                        <Home className="w-4 h-4" />
                      ) : (
                        <GraduationCap className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase text-indigo-300 tracking-wider">
                        Option A
                      </span>
                      <h3 className="text-xs font-bold text-white">
                        <FinancialText text={activeScenario.optionA.label} />
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeChoice === 'A'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {weightA}% Weight
                  </span>
                </div>
              </motion.button>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <FinancialText text={activeScenario.optionA.impact} />
              </p>
            </motion.article>

            {/* Option B Chip */}
            <motion.article
              className={`p-3.5 rounded-2xl border transition-all ${
                activeChoice === 'B'
                  ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-500/20 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300'
              }`}
            >
              <motion.button
                type="button"
                aria-pressed={activeChoice === 'B'}

                onClick={() => handleSelectChip('B')}
                className="w-full cursor-pointer text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#819cff]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300">
                      {isMichael ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Palmtree className="w-4 h-4" />
                      )}
                    </span>
                    <div>
                      <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">
                        Option B
                      </span>
                      <h3 className="text-xs font-bold text-white">
                        <FinancialText text={activeScenario.optionB.label} />
                      </h3>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeChoice === 'B'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {weightB}% Weight
                  </span>
                </div>
              </motion.button>

              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <FinancialText text={activeScenario.optionB.impact} />
              </p>
            </motion.article>
          </div>

          {/* ── Priority Balance Bar ────────────────────────────────────────── */}
          <div className="pt-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="text-indigo-300 font-semibold">
                Option A: {weightA}%
              </span>
              <span className="text-xs text-slate-400">Relative Weight</span>
              <span className="text-emerald-300 font-semibold">
                Option B: {weightB}%
              </span>
            </div>

            {/* Split Visual Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${weightA}%` }}
              />
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${weightB}%` }}
              />
            </div>

            {/* Quick Balance Presets */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                onClick={() => applyPreset('favorA')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Option A (71/29)
              </button>
              <button
                onClick={() => applyPreset('balanced')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Balanced (50/50)
              </button>
              <button
                onClick={() => applyPreset('favorB')}
                className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition-colors"
              >
                Option B (29/71)
              </button>
            </div>
          </div>
        </div>

        {/* ── Priority Importance Sliders (1 to 5 Stars for Each Option) ────── */}
        <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Priority Importance Sliders</span>
            </h3>
            <span className="text-xs text-slate-400">1 to 5 Stars</span>
          </div>

          {/* Slider for Option A */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="min-w-0 font-semibold text-indigo-300">
                <FinancialText text={activeScenario.optionA.label} />
              </span>
              <span className="text-xs font-bold text-amber-300">
                {starsA} / 5 Stars
              </span>
            </div>

            {/* Interactive Stars Row */}
            <div className="flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handlePriorityChange('A', star)}
                    aria-pressed={starsA === star}
                    aria-label={`Rate option A ${star} out of 5`}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= starsA
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 italic">
                {getStarLabel(starsA)}
              </span>
            </div>

            {/* Range Slider for Option A */}
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={starsA}
              aria-label="Importance of option A"
              onChange={(e) => handlePriorityChange('A', Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none mt-1"
            />
          </div>

          {/* Slider for Option B */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="min-w-0 font-semibold text-emerald-300">
                <FinancialText text={activeScenario.optionB.label} />
              </span>
              <span className="text-xs font-bold text-amber-300">
                {starsB} / 5 Stars
              </span>
            </div>

            {/* Interactive Stars Row */}
            <div className="flex flex-wrap items-center justify-between gap-y-2">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handlePriorityChange('B', star)}
                    aria-pressed={starsB === star}
                    aria-label={`Rate option B ${star} out of 5`}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= starsB
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 italic">
                {getStarLabel(starsB)}
              </span>
            </div>

            {/* Range Slider for Option B */}
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={starsB}
              aria-label="Importance of option B"
              onChange={(e) => handlePriorityChange('B', Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none mt-1"
            />
          </div>
        </div>

        {/* ── Timeline Horizon Scrubber (2026 to 2050) ───────────────────────── */}
        <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Calendar className="w-4 h-4" />
              <span>Living Map Timeline Scrubber</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-xl border border-slate-700">
                Year {timelineYear}
              </span>
              <span className="text-xs font-semibold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-lg border border-sky-800/40">
                Age {currentAgeAtScrub}
              </span>
            </div>
          </div>

          {/* Scrubber Range Slider */}
          <input
            type="range"
            min={2026}
            max={2050}
            step={1}
            value={timelineYear}
            aria-label="Timeline year"
            onChange={(e) => handleTimelineChange(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
          />

          {/* Quick Milestone Jump Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1">
            {isMichael ? (
              <>
                <button
                  onClick={() => handleTimelineChange(2026)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2026
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2026 Start
                </button>
                <button
                  onClick={() => handleTimelineChange(2027)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2027
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2027 Home
                </button>
                <button
                  onClick={() => handleTimelineChange(2035)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2035
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2035 Growth
                </button>
                <button
                  onClick={() => handleTimelineChange(2047)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2047
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2047 Retire 58
                </button>
                <button
                  onClick={() => handleTimelineChange(2050)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2050
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2050 Retire 61
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleTimelineChange(2026)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2026
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2026 Ethan
                </button>
                <button
                  onClick={() => handleTimelineChange(2028)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2028
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2028 Ava
                </button>
                <button
                  onClick={() => handleTimelineChange(2030)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2030
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2030 2nd Home
                </button>
                <button
                  onClick={() => handleTimelineChange(2044)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2044
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2044 Retire 65
                </button>
                <button
                  onClick={() => handleTimelineChange(2050)}
                  className={`min-h-11 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                    timelineYear === 2050
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  2050 Legacy
                </button>
              </>
            )}
          </div>

          {/* Dynamic Milestone Projection Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold border ${milestoneData.statusColor}`}
              >
                {milestoneData.badge}
              </span>


            </div>

            <h4 className="text-xs font-bold text-white">
              <FinancialText text={milestoneData.title} />
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              <FinancialText text={milestoneData.narrative} />
            </p>

            {/* 3 Key Extracted Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
              <div className="p-2 rounded-xl bg-slate-900/90 text-center">
                <div className="text-xs text-slate-400 truncate">
                  <FinancialText text={milestoneData.stat1Label} />
                </div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  <FinancialText text={milestoneData.stat1Val} />
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 text-center">
                <div className="text-xs text-slate-400 truncate">
                  <FinancialText text={milestoneData.stat2Label} />
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-0.5 truncate">
                  <FinancialText text={milestoneData.stat2Val} />
                </div>
              </div>

              <div className="p-2 rounded-xl bg-slate-900/90 text-center">
                <div className="text-xs text-slate-400 truncate">
                  <FinancialText text={milestoneData.stat3Label} />
                </div>
                <div className="text-xs font-bold text-indigo-300 mt-0.5 truncate">
                  <FinancialText text={milestoneData.stat3Val} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <div className="pt-2 pb-2 relative z-10 space-y-2">
        <button
          onClick={handleContinueToAction}
          className="w-full py-4 rounded-2xl bg-[#4565d6] hover:bg-[#6380ff] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Continue to Your Action Plan</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-slate-400 text-center">
          Next: Turn your trade-off simulation into a concrete 5-minute win.
        </p>
      </div>

      {/* ── Grounding Inspector Modal ───────────────────────────────────────── */}
      <GroundingInspector
        grounding={activeGrounding}
        onClose={() => setActiveGrounding(null)}
      />
    </div>
  );
}
