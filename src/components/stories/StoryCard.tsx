/**
 * src/components/stories/StoryCard.tsx
 *
 * Full-screen individual story card:
 *  - Bold typographic numbers and tailored layout per pillar
 *  - Clickable underlined financial terms → opens CalibrationMicroCard
 *  - 4-second pause sensor → triggers implicit calibration automatically
 *  - Grounding Badge on metrics → inspects raw MCP data
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
  Volume2,
} from 'lucide-react';
import type { StoryCard as StoryCardType, GroundingRef, ViewingStyle, PillarScore } from '../../types';
import {
  ScoreRing,
  PillarBars,
  SuperpowerVsLeakViz,
  RealLifeTranslatorViz,
  LiquidityTankPreview,
  TimelineMini,
  DominoChecklist,
} from './StoryDataViz';

interface Props {
  card: StoryCardType;
  isActive: boolean;
  pillars?: PillarScore[];
  viewingStyle: ViewingStyle | null;
  onCalibrationOpen: (term: string) => void;
  onInspectGrounding: (ref: GroundingRef) => void;
  onSelectStyle?: (style: ViewingStyle) => void;
  onActionComplete?: () => void;
  stepChecklist?: boolean[];
  onToggleStep?: (idx: number) => void;
}

// Financial terms dictionary to detect in prose
const RECOGNIZED_TERMS: { pattern: RegExp; key: string; label: string }[] = [
  { pattern: /18% (?:credit card|card|revolving debt)/i, key: 'revolving-apr', label: '18% APR Debt' },
  { pattern: /roth(?: ira)?/i, key: 'roth-ira', label: 'Roth IRA' },
  { pattern: /umbrella(?: liability)?/i, key: 'umbrella-liability', label: 'Umbrella Liability' },
  { pattern: /mortality(?: ratio| coverage)?/i, key: 'mortality-ratio', label: 'Mortality Ratio' },
  { pattern: /529(?: plan| college)?/i, key: '529-plan', label: '529 Plan' },
  { pattern: /leveraged etf|upro/i, key: 'leveraged-etf', label: 'Leveraged ETF (UPRO)' },
  { pattern: /withdrawal rate/i, key: 'withdrawal-rate', label: 'Withdrawal Rate' },
];

export function StoryCard({
  card,
  isActive,
  pillars = [],
  viewingStyle,
  onCalibrationOpen,
  onInspectGrounding,
  onSelectStyle,
  onActionComplete,
  stepChecklist = [false, false, false],
  onToggleStep = () => {},
}: Props) {
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredPauseRef = useRef(false);

  // ── 4-Second Pause Sensor ("Zero-Prompt Calibration") ───────────────────────
  useEffect(() => {
    if (!isActive) {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      hasTriggeredPauseRef.current = false;
      return;
    }

    // Default term to calibrate for this card
    const defaultTerms: Record<string, string> = {
      'story-vibe': 'roth-ira',
      'story-overview': 'revolving-apr',
      'story-translator': '529-plan',
      'story-advice': 'umbrella-liability',
      'story-living-map': 'withdrawal-rate',
      'story-action': 'revolving-apr',
    };

    const termKey = defaultTerms[card.id];

    pauseTimerRef.current = setTimeout(() => {
      if (isActive && !hasTriggeredPauseRef.current && termKey) {
        hasTriggeredPauseRef.current = true;
        onCalibrationOpen(termKey);
      }
    }, 4500); // 4.5 seconds pause detection

    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [isActive, card.id, onCalibrationOpen]);

  // Helper to render prose with clickable underlined terms
  function renderClickableText(text: string) {
    let result = text;
    for (const item of RECOGNIZED_TERMS) {
      if (item.pattern.test(result)) {
        const parts = result.split(item.pattern);
        const match = text.match(item.pattern)?.[0];
        if (match) {
          return (
            <span>
              {parts[0]}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCalibrationOpen(item.key);
                }}
                className="inline-flex items-center text-amber-300 font-semibold underline decoration-amber-400 decoration-dotted underline-offset-4 hover:text-amber-200 transition-colors cursor-pointer"
              >
                {match}
                <Info className="w-3 h-3 ml-0.5 inline-block text-amber-400" />
              </button>
              {parts[1]}
            </span>
          );
        }
      }
    }
    return <span>{text}</span>;
  }

  return (
    <div className="h-full flex flex-col justify-between p-6 select-none relative z-10 text-white">
      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="pt-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold text-slate-200 border border-white/10">
            <span className="capitalize">{card.pillar.replace('-', ' ')}</span>
            <span className="text-white/40">·</span>
            <span className="text-emerald-400">Pillar {card.storyIndex + 1}/6</span>
          </div>

          {card.grounding && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInspectGrounding(card.grounding!);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Grounding Badge</span>
            </button>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black text-white mt-3 leading-tight tracking-tight"
        >
          {card.title}
        </motion.h1>

        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          {renderClickableText(card.subtitle)}
        </p>
      </div>

      {/* ── Center Content / Interactive Visualization ──────────────────────── */}
      <div className="my-auto py-2">
        {/* Story 0: Vibe Check Style Picker */}
        {card.interactiveType === 'vibe_check' && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-300 mb-1">
              Select your viewing rhythm:
            </div>
            {[
              {
                id: 'visual' as const,
                title: 'Peace of Mind / Visual 🌿',
                desc: 'Family protection, children’s future, clean milestones with zero jargon.',
              },
              {
                id: 'analytical' as const,
                title: 'Analytical / Direct to Numbers 📊',
                desc: 'ROI, debt interest rates, tax brackets, and portfolio volatility.',
              },
              {
                id: 'express' as const,
                title: 'Express Mode ⚡',
                desc: 'Executive summary under 60 seconds with immediate next step.',
              },
            ].map((opt) => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStyle?.(opt.id);
                }}
                className={`w-full p-4 rounded-2xl text-left border transition-all ${
                  viewingStyle === opt.id
                    ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-lg'
                    : 'bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm text-white">{opt.title}</div>
                <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Story 1: Overview Superpower vs Leak */}
        {card.interactiveType === 'superpower_vs_leak' && (
          <div>
            <ScoreRing
              score={Number(card.dataPoints.find((d) => d.label.includes('Health Score'))?.value || 60)}
              band="Stable"
            />
            <SuperpowerVsLeakViz
              superpowerLabel="Liquid Cash Cushion"
              superpowerVal={String(card.dataPoints[0]?.value || '$150,000')}
              superpowerSub="16 months of living expenses ready to work"
              leakLabel="18% Revolving Card Interest"
              leakVal={String(card.dataPoints[1]?.value || '$3,240/yr')}
              leakSub="Burned on Chase balance — tap for breakdown"
              onInspectLeak={() => onCalibrationOpen('revolving-apr')}
            />
          </div>
        )}

        {/* Story 2: Real-Life Translator */}
        {card.interactiveType === 'real_life_analogy' && (
          <div>
            <RealLifeTranslatorViz
              annualCost="$3,240/yr"
              equivalentMilestone="1 Semester at College for Liam"
              explanation="Eliminating your 18% credit card interest frees up exactly enough money to fund Liam's first year college savings without cutting spending."
            />
            {pillars.length > 0 && <PillarBars pillars={pillars} />}
          </div>
        )}

        {/* Story 3: Advice & Liquidity Tank Preview */}
        {card.interactiveType === 'liquidity_tank_preview' && (
          <div>
            <LiquidityTankPreview
              totalCash="$150,000"
              surplusCash="$60,222"
              strategiesCount={4}
            />
            <div className="space-y-2 mt-2">
              {card.dataPoints.map((dp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 font-medium">{dp.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white">{dp.value}</span>
                    {dp.grounding && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectGrounding(dp.grounding!);
                        }}
                        className="text-emerald-400 p-0.5 hover:text-emerald-300"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story 4: Living Map Time Machine */}
        {card.interactiveType === 'time_machine' && (
          <div>
            <TimelineMini retirementAge={62} />
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-2 mt-3">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Zero-Hallucination Grounding</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                All milestones are deterministically mapped to your Sherpas Living Map. If you ask about off-plan investments (like crypto), our Guardrail Router guides you right back to your life goals.
              </p>
            </div>
          </div>
        )}

        {/* Story 5: 5-Minute Win Action */}
        {card.interactiveType === 'wrapped_summary' && (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                The First Domino
              </span>
              <div className="text-xl font-black text-white leading-tight">
                Transfer $6,800 to 18% Chase Card
              </div>
              <div className="text-xs text-emerald-300 font-semibold mt-1">
                Saves $1,224/yr + Lifts health score 60 → 62
              </div>
            </div>

            <DominoChecklist
              steps={[
                'Open mobile banking and pay $6,800 to Chase card from surplus cash',
                'Your score cap lifts immediately to 62/100',
                'Queue your couple consensus for your upcoming Sherpas advisor call',
              ]}
              completed={stepChecklist}
              onToggleStep={onToggleStep}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionComplete?.();
              }}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span>Continue to Consensus & Advisor Prep</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom Footer / Navigation Hint ─────────────────────────────────── */}
      <div className="pb-4 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Tap right to advance · Hold to pause
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCalibrationOpen('revolving-apr');
          }}
          className="text-amber-300 hover:text-amber-200 underline underline-offset-2 flex items-center gap-1"
        >
          <Info className="w-3 h-3" />
          <span>Need help?</span>
        </button>
      </div>
    </div>
  );
}
