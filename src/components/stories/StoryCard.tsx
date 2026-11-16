/**
 * src/components/stories/StoryCard.tsx
 *
 * Full-screen individual story card:
 *  - Responsive vertical layout with scrollable center content to prevent ANY mobile overlap
 *  - Underlined financial terms trigger instant micro-calibration
 *  - 4-second pause sensor triggers Zero-Prompt Calibration
 *  - Grounding Badge on metrics to inspect raw MCP JSON
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Sparkles,
  Info,
  ChevronRight,
  TrendingUp,
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

  // ── 4-Second Inactivity Sensor ("Zero-Prompt Calibration") ──────────────────
  useEffect(() => {
    if (!isActive) {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
      hasTriggeredPauseRef.current = false;
      return;
    }

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
    }, 4500);

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
    <div className="h-full flex flex-col justify-between px-5 pt-14 pb-24 select-none relative z-10 text-white overflow-hidden">
      {/* ── Top Header (Shrink-0 to avoid crushing) ─────────────────────────── */}
      <div className="shrink-0 mb-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-semibold text-slate-200 border border-white/10">
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
              className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 transition-colors"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Grounding Badge</span>
            </button>
          )}
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-black text-white mt-2 leading-tight tracking-tight"
        >
          {card.title}
        </motion.h1>

        <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
          {renderClickableText(card.subtitle)}
        </p>
      </div>

      {/* ── Center Content Area: Scrollable with safe bounds so NO overlap happens ── */}
      <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2">
        {/* Story 0: Vibe Check Style Picker */}
        {card.interactiveType === 'vibe_check' && (
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-semibold text-slate-300">
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
                className={`w-full p-3.5 rounded-2xl text-left border transition-all ${
                  viewingStyle === opt.id
                    ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-lg'
                    : 'bg-slate-900/70 border-slate-700/70 text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-xs text-white">{opt.title}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{opt.desc}</div>
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
              size={110}
            />
            <SuperpowerVsLeakViz
              superpowerLabel="Liquid Cash Cushion"
              superpowerVal={String(card.dataPoints[0]?.value || '$150,000')}
              superpowerSub="16 months expenses ready to work"
              leakLabel="18% Revolving Card"
              leakVal={String(card.dataPoints[1]?.value || '$3,240/yr')}
              leakSub="Interest burned — tap to calibrate"
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
            <div className="space-y-1.5 mt-2">
              {card.dataPoints.map((dp, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 text-xs"
                >
                  <span className="text-slate-300 font-medium text-[11px]">{dp.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-white text-[11px]">{dp.value}</span>
                    {dp.grounding && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onInspectGrounding(dp.grounding!);
                        }}
                        className="text-emerald-400 p-0.5 hover:text-emerald-300"
                      >
                        <ShieldCheck className="w-3 h-3" />
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
            <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs space-y-1.5 mt-2">
              <div className="font-semibold text-indigo-300 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Zero-Hallucination Grounding</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                All milestones are deterministically mapped to your Sherpas Living Map. If you ask about off-plan investments (like crypto), our Boomerang Guardrail guides you right back to your life goals.
              </p>
            </div>
          </div>
        )}

        {/* Story 5: 5-Minute Win Action */}
        {card.interactiveType === 'wrapped_summary' && (
          <div className="space-y-2.5">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">
                The First Domino
              </span>
              <div className="text-base font-black text-white leading-tight">
                Transfer $6,800 to 18% Chase Card
              </div>
              <div className="text-[11px] text-emerald-300 font-semibold mt-0.5">
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

            {/* Clear, unblocked Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onActionComplete?.();
              }}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer mt-2"
            >
              <span>Continue to Consensus & Advisor Prep</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Bottom Footer / Navigation Hint (Shrink-0) ──────────────────────── */}
      <div className="shrink-0 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Tap right to advance · Tap left to return
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCalibrationOpen('revolving-apr');
          }}
          className="text-amber-300 hover:text-amber-200 underline underline-offset-2 flex items-center gap-0.5 font-medium"
        >
          <Info className="w-3 h-3" />
          <span>Need help?</span>
        </button>
      </div>
    </div>
  );
}
