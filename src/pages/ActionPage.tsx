/**
 * src/pages/ActionPage.tsx
 *
 * "The Action Plan & Advisor Pre-Meeting View":
 *  - "Your 5-Minute Win" header with celebration badge
 *  - Big Dollar Impact Card ($3,240/yr interest saved, or score lift)
 *  - Interactive 3-step checklist with checkable items
 *  - "Advisor Pre-Meeting View" (Plug-and-play for Sherpas dashboard):
 *      * Comprehension Telemetry (score %, calibrated doubts like Roth IRA, Umbrella)
 *      * Couple Consensus summary (Agreements & Tie-breakers)
 *      * "3 Human Questions for the Zoom Call" (advisor cheat-sheet to skip screen-sharing)
 *  - Multi-Touch Smart Nudges:
 *      * Auto-generated WhatsApp & Email draft preview based on user hesitation/calibration
 *      * "Copy Nudge to Clipboard" button
 *  - "Start New Household Session" button (returns to /)
 *  - Integrated SplitScreenToggle: switches seamlessly between Single Phone and Split Screen (Projector demo)
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Share2,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Calendar,
  RotateCcw,
  Users,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  Activity,
  AlertCircle,
  Smartphone,
  ChevronRight,
  Send,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import { extractHouseholdSync } from '../lib/mcp/extractor';
import { GroundingInspector } from '../components/calibration/GroundingInspector';
import {
  SplitScreenToggle,
  SplitScreenContainer,
  type SplitMode,
  type SplitTarget,
} from '../components/shared/SplitScreenToggle';
import type { GroundingRef } from '../types';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  timeEstimate: string;
  tag: string;
  completed: boolean;
  grounding?: GroundingRef;
}

export default function ActionPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const currentCase = useAppStore((s) => s.currentCase);
  const setCase = useAppStore((s) => s.setCase);
  const partner = useAppStore((s) => s.partner);
  const coupleAllocations = useAppStore((s) => s.coupleAllocations);
  const telemetryEvents = useAppStore((s) => s.telemetryEvents);
  const resetStore = useAppStore((s) => s.reset);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  const activeCase = currentCase ?? CASES.find((c) => c.id === caseId) ?? CASES[0];

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  // Household & Partner details
  const client = activeCase.financialHealth?.case?.household?.find((m) => m.role === 'client');
  const coClient = activeCase.financialHealth?.case?.household?.find((m) => m.role === 'co-client');
  const clientName = client?.first_name || 'Timothy';
  const partnerName = coClient?.first_name || 'Melanie';
  const isCouple = activeCase.householdType === 'couple' || Boolean(coClient);

  // Sync data (Agreements & Tie-breakers)
  const syncData = extractHouseholdSync(
    activeCase.id,
    coupleAllocations.primary,
    coupleAllocations.secondary
  );

  // Screen layout state
  const [splitMode, setSplitMode] = useState<SplitMode>('single');
  const [splitTarget, setSplitTarget] = useState<SplitTarget>('advisor');
  const [activeTab, setActiveTab] = useState<'plan' | 'advisor'>('plan');
  const [nudgeChannel, setNudgeChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copiedNudge, setCopiedNudge] = useState(false);
  const [activeGrounding, setActiveGrounding] = useState<GroundingRef | null>(null);

  // Dynamic Case Specific Configuration
  const isWeah = activeCase.id === 'timothy-melanie-weah';
  const isJohnson = activeCase.id === 'daniel-emily-johnson';
  const isCarter = activeCase.id === 'michael-carter';
  const isLewis = activeCase.id === 'samantha-lewis';

  // Big Dollar Impact Card Details
  let bigDollarAmount = '$3,240/yr';
  let bigDollarLabel = 'Annual Interest Saved';
  let bigDollarSubtext = 'Freed up by paying 18% credit card with idle cash reserves';
  let scoreLiftLabel = '+18 pts Lift (60 → 78)';
  let immediateCashflow = '$270/mo unlocked';

  let defaultChecklist: ChecklistItem[] = [
    {
      id: 'step-1',
      title: 'Transfer $6,800 to 18% Chase Card',
      description: 'Lifts revolving score gate from 60 to 62 and saves $1,224/yr in interest immediately.',
      timeEstimate: '2 mins',
      tag: 'Critical Gate',
      completed: true,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'score.top_moves[0].action',
        label: 'Pay Down Revolving Card ($6,800)',
        rawValue: '$6,800 from cash',
        description: 'Removes high revolving balance cap, lifting score immediately to 62.',
      },
    },
    {
      id: 'step-2',
      title: 'Lock In $1M Umbrella Liability Policy',
      description: 'Both partners agreed on this priority. ~$25/mo protects your entire $695,500 net worth.',
      timeEstimate: '3 mins',
      tag: 'Full Consensus',
      completed: false,
      grounding: {
        sourceFile: 'financial-health.json',
        jsonPath: 'score.top_moves[2].action',
        label: '$1M Umbrella Liability Shield',
        rawValue: '$1,000,000 policy',
        description: 'Raises liability shield above standard auto & home limits.',
      },
    },
    {
      id: 'step-3',
      title: 'Join 15-Minute Zoom with Sherpas Advisor',
      description: 'Advisor has your comprehension telemetry. Skip slides and decide the 529 vs Life Insurance split.',
      timeEstimate: '15 mins',
      tag: 'Human Tie-Breaker',
      completed: false,
      grounding: {
        sourceFile: 'persona.md',
        jsonPath: 'advisor.meeting.agenda',
        label: 'Sherpas 15-Minute Human Zoom',
        rawValue: 'Pre-calibrated meeting',
        description: 'Human advisor reviews 3 tension questions without screen-sharing friction.',
      },
    },
  ];

  if (isJohnson) {
    bigDollarAmount = '$1,000/yr';
    bigDollarLabel = 'State Tax Credit Captured';
    bigDollarSubtext = 'Colorado 529 state deduction + college runway secured';
    scoreLiftLabel = '+12 pts Lift (64 → 76)';
    immediateCashflow = '$83/mo tax refund';

    defaultChecklist = [
      {
        id: 'step-1',
        title: 'Activate Colorado 529 Direct-Debit',
        description: 'Automate $200/mo per child to capture the $1,000 Colorado tax credit.',
        timeEstimate: '3 mins',
        tag: 'Tax Deduction',
        completed: true,
      },
      {
        id: 'step-2',
        title: 'Confirm Employer 401(k) Match',
        description: 'Ensure current savings pace does not drop below the full 6% company match.',
        timeEstimate: '2 mins',
        tag: 'Guaranteed 100% ROI',
        completed: false,
      },
      {
        id: 'step-3',
        title: 'Align on Age 62 vs 64 Retirement Pace',
        description: '15-min zoom to review 529 contribution balance vs retirement milestone.',
        timeEstimate: '15 mins',
        tag: 'Trade-off Sync',
        completed: false,
      },
    ];
  } else if (isCarter) {
    bigDollarAmount = '+$110,000';
    bigDollarLabel = 'Compounding Wealth Swing';
    bigDollarSubtext = 'Down payment for $550k Austin home secured by 2027';
    scoreLiftLabel = '+24 pts Lift (26 → 50)';
    immediateCashflow = '+$1,500/mo savings rate';

    defaultChecklist = [
      {
        id: 'step-1',
        title: 'Open Dedicated 4.5% APY Home Savings',
        description: 'Label account "Austin Home 2027" and automate $1,500 monthly transfer.',
        timeEstimate: '4 mins',
        tag: 'Goal Automated',
        completed: true,
      },
      {
        id: 'step-2',
        title: 'Cap Discretionary Dining & Travel Spend',
        description: 'Keeps lifestyle inflation bounded to preserve 2027 down payment timeline.',
        timeEstimate: '3 mins',
        tag: 'Cash Reservoir',
        completed: false,
      },
      {
        id: 'step-3',
        title: 'Advisor Zoom: 2027 Home vs Age 58 Retirement',
        description: 'Review mortgage scenarios and real estate tax deductions.',
        timeEstimate: '15 mins',
        tag: 'Strategic Plan',
        completed: false,
      },
    ];
  } else if (isLewis) {
    bigDollarAmount = '$45,000';
    bigDollarLabel = 'Tax-Advantaged Growth';
    bigDollarSubtext = 'Fund teen college tuition without postponing 2030 second home';
    scoreLiftLabel = '+14 pts Lift (72 → 86)';
    immediateCashflow = '$3,750/yr saved in taxes';

    defaultChecklist = [
      {
        id: 'step-1',
        title: 'Direct Bonus Allocation to 529 Plans',
        description: 'Fund immediate college tuition runway for teens tax-free.',
        timeEstimate: '3 mins',
        tag: 'Education Priority',
        completed: true,
      },
      {
        id: 'step-2',
        title: 'Review Second Home Equity Strategy',
        description: 'Keep 2030 Florida purchase on track while protecting primary estate.',
        timeEstimate: '5 mins',
        tag: 'Living Map Milestone',
        completed: false,
      },
      {
        id: 'step-3',
        title: 'Schedule Wealth Advisor Consultation',
        description: 'Review trust protection and municipal bond allocation.',
        timeEstimate: '15 mins',
        tag: 'Advisor Call',
        completed: false,
      },
    ];
  }

  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);

  function toggleChecklistItem(id: string) {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
    addTelemetryEvent({
      type: 'allocation_set',
      payload: { action: 'toggle_checklist_item', itemId: id },
      timestamp: Date.now(),
    });
  }

  const completedCount = checklist.filter((item) => item.completed).length;

  // ── Auto-generated Smart Nudge Text ─────────────────────────────────────────
  const whatsappNudge = isCouple
    ? `Hey ${clientName} & ${partnerName}! 👋 Congratulations on completing your 5-minute Sherpas Pulse session.

Here are your key household breakthroughs:
✅ Saved ${bigDollarAmount} by taking swift action on your cash priorities.
✅ Unlocked your Financial Health Score (${scoreLiftLabel}).
✅ Reached consensus on key protection priorities (Umbrella & Liquidity).

For our Zoom call, we won't waste any time with generic screen-sharing slides. We'll jump straight into aligning your top tie-breaker (College 529 vs Life Insurance)!

📅 Confirmed: Thursday @ 10:30 AM
🔗 Zoom Link: https://meet.sherpas.io/${activeCase.id}

See you both soon!`
    : `Hi ${clientName}! 👋 Fantastic job finishing your Sherpas Pulse financial checkup.

Your immediate breakthrough:
✅ ${bigDollarAmount} ${bigDollarLabel}
✅ Score Lift: ${scoreLiftLabel}
✅ 3-step action checklist ready in your dashboard.

Your Sherpas advisor has already reviewed your profile and queued up your 3 core questions. No slide decks — straight to high-impact planning.

🔗 Zoom Link: https://meet.sherpas.io/${activeCase.id}`;

  const emailSubject = `Your Sherpas Pulse Breakthrough: ${bigDollarAmount} Saved & Advisor Meeting Agenda`;
  const emailNudge = `Subject: ${emailSubject}

Dear ${isCouple ? `${clientName} and ${partnerName}` : clientName},

Thank you for completing your 5-minute Sherpas Pulse household alignment session. We have received your comprehension telemetry and consensus profile.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. YOUR 5-MINUTE FINANCIAL WIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Big Dollar Impact: ${bigDollarAmount} (${bigDollarLabel})
• Score Impact: ${scoreLiftLabel}
• Summary: ${bigDollarSubtext}
• Immediate Monthly Benefit: ${immediateCashflow}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. IMMEDIATE 3-STEP ACTION PLAN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${checklist.map((item, idx) => `${idx + 1}. [${item.completed ? 'DONE' : 'PENDING'}] ${item.title} — ${item.description}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. ADVISOR ZOOM CALL FOCUS (15 Mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
We will skip screen-sharing and slide presentations. Your advisor will focus directly on:
• Resolving your primary prioritization balance
• Clarifying calibrated doubts flagged during your session
• Confirming bank and insurance next steps

Looking forward to our conversation!

Warm regards,
The Sherpas Wealth Advisory Team
https://sherpas.io`;

  function handleCopyNudge() {
    const textToCopy = nudgeChannel === 'whatsapp' ? whatsappNudge : emailNudge;
    navigator.clipboard.writeText(textToCopy);
    setCopiedNudge(true);
    setTimeout(() => setCopiedNudge(false), 2500);

    addTelemetryEvent({
      type: 'allocation_set',
      payload: { action: 'copy_nudge', channel: nudgeChannel },
      timestamp: Date.now(),
    });
  }

  function handleStartNewSession() {
    resetStore();
    navigate('/');
  }

  // ── Render: Client Action Plan (Left View) ──────────────────────────────────
  const renderClientPlanView = (
    <div className="p-5 space-y-6 text-white">
      {/* ── Celebration Header ────────────────────────────────────────────── */}
      <div className="pt-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Your 5-Minute Win</span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-white mt-2 leading-tight">
          {isCouple ? `${clientName} & ${partnerName}’s Breakthrough` : `${clientName}’s Breakthrough`}
        </h1>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          One decisive move that unlocks trapped cash flow and elevates your household financial score.
        </p>
      </div>

      {/* ── Big Dollar Impact Card ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-[#202237] border border-emerald-500/30 p-5 relative overflow-hidden"
      >

        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" />
            <span>Guaranteed Dollar Return</span>
          </span>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            {scoreLiftLabel}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            {bigDollarAmount}
          </span>
        </div>
        <p className="text-sm font-semibold text-emerald-200 mt-1">{bigDollarLabel}</p>
        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{bigDollarSubtext}</p>

        {/* Impact Sub-metrics */}
        <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Monthly Relief</span>
            <span className="text-sm font-black text-white">{immediateCashflow}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Zero-Risk Yield</span>
            <span className="text-sm font-black text-emerald-400">18.0% Guaranteed</span>
          </div>
        </div>

        {/* Grounding Inspector Button */}
        {isWeah && (
          <button
            type="button"
            onClick={() =>
              setActiveGrounding({
                sourceFile: 'financial-health.json',
                jsonPath: 'score.caps_applied[0] & persona.md > T3',
                label: '18% Credit Card Drag Eliminator',
                rawValue: '$18,000 balance @ 18% APR = $3,240/yr burned',
                description: 'Paying off $18,000 from cash eliminates the score cap and frees $270/mo.',
              })
            }
            className="mt-3.5 w-full py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verify Grounding (Deterministic MCP Source)</span>
          </button>
        )}
      </motion.div>

      {/* ── Interactive 3-Step Checklist ──────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide flex items-center gap-1.5">
              <span>Your 3-Step Execution Plan</span>
            </h2>
            <p className="text-xs text-slate-400">Tap any step to mark complete as you take action</p>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
            {completedCount} / {checklist.length} Done
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(completedCount / checklist.length) * 100}%` }}
          />
        </div>

        <div className="space-y-2">
          {checklist.map((item, idx) => (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.99 }}
              onClick={() => toggleChecklistItem(item.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                item.completed
                  ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={`Toggle ${item.title}`}
                  className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors flex-shrink-0"
                >
                  {item.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold leading-snug ${
                        item.completed ? 'text-emerald-300 line-through opacity-85' : 'text-white'
                      }`}
                    >
                      {idx + 1}. {item.title}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-800 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {item.timeEstimate}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.tag}
                    </span>

                    {item.grounding && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveGrounding(item.grounding!);
                        }}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                      >
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                        <span>Source</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Multi-Touch Smart Nudges ──────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
              <Send className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white">Multi-Touch Smart Nudge</h3>
              <p className="text-[10px] text-slate-400">Pre-drafted action nudge for your advisor or family</p>
            </div>
          </div>

          {/* WhatsApp / Email Pill Toggle */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px]">
            <button
              type="button"
              onClick={() => setNudgeChannel('whatsapp')}
              className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                nudgeChannel === 'whatsapp'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setNudgeChannel('email')}
              className={`px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                nudgeChannel === 'email'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </button>
          </div>
        </div>

        {/* Nudge Preview Box */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-44 overflow-y-auto">
          {nudgeChannel === 'whatsapp' ? whatsappNudge : emailNudge}
        </div>

        {/* Copy to Clipboard Button */}
        <button
          type="button"
          onClick={handleCopyNudge}
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] ${
            copiedNudge
              ? 'bg-emerald-600 text-white'
              : 'bg-[#4565d6] hover:bg-[#6380ff] text-white'
          }`}
        >
          {copiedNudge ? (
            <>
              <Check className="w-4 h-4" />
              <span>Copied to Clipboard! Ready to Send</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy {nudgeChannel === 'whatsapp' ? 'WhatsApp' : 'Email'} Nudge to Clipboard</span>
            </>
          )}
        </button>
      </div>

      {/* ── Start New Household Session & Back to Overview ─────────────────── */}
      <div className="pt-2 pb-4 space-y-2">
        <button
          type="button"
          onClick={handleStartNewSession}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <RotateCcw className="w-4 h-4 text-indigo-400" />
          <span>Start New Household Session</span>
        </button>

        <p className="text-[10px] text-center text-slate-500">
          Sherpas Pulse · Zero-Hallucination Advice Engine · Powered by MCP
        </p>
      </div>
    </div>
  );

  // ── Render: Advisor Pre-Meeting View (Right View / Sherpas Dashboard) ───────
  const renderAdvisorView = (
    <div className="p-5 space-y-6 text-white">
      {/* ── Advisor Top Header ────────────────────────────────────────────── */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/40">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sherpas Advisor Dashboard</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Telemetry Ready
          </span>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-white mt-2 leading-tight">
          Advisor Pre-Meeting View
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Skip slide presentations. Review calibrated doubts and jump directly into human alignment.
        </p>
      </div>

      {/* ── Comprehension Telemetry Card ──────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs">
              94%
            </div>
            <div>
              <span className="text-xs font-bold text-white block">Comprehension Index</span>
              <span className="text-[10px] text-slate-400">High engagement across financial concepts</span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Zero Drop-off
          </span>
        </div>

        {/* Calibrated Doubts & Hesitation Hotspots */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
            Calibrated Doubts & Dwell Times:
          </span>

          <div className="space-y-1.5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-amber-500/30 flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-300 block">Roth IRA Backdoor Limit</span>
                <span className="text-[10px] text-slate-400">2 taps on grounding · 42s hesitation dwell</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                Calibrated
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="font-semibold text-indigo-300 block">Umbrella Liability Shield</span>
                <span className="text-[10px] text-slate-400">Tapped to verify $1M coverage calculation</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                Resolved
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white block">18% Credit Card Drag</span>
                <span className="text-[10px] text-slate-400">Zero hesitation · 100% agreement on payoff</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                Full Clarity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Couple Consensus Summary ──────────────────────────────────────── */}
      {isCouple && (
        <div className="p-4 rounded-2xl bg-[#202237] border border-slate-700/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Couple Consensus Summary</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {clientName} & {partnerName}
            </span>
          </div>

          <div className="space-y-2">
            {/* Green Zone: Agreements */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Agreements (Green Zone)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Both agreed on <strong>Pay off 18% Credit Card ($18,000)</strong> saving $3,240/yr and adding <strong>$1M Umbrella Policy</strong>.
              </p>
            </div>

            {/* Amber Zone: Tie-Breakers */}
            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Advisor Tie-Breaker (Amber Zone)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {clientName} prioritized <strong>College 529 ($4,609/yr)</strong> as #2, while {partnerName} prioritized <strong>Term Life Insurance ($235,000)</strong> as #2.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── "3 Human Questions for the Zoom Call" ──────────────────────────── */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-indigo-500/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">
              <HelpCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-xs font-bold text-white">3 Human Questions for the Zoom Call</h3>
              <p className="text-[10px] text-indigo-300">Advisor Cheat-Sheet: Skip the slides</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Question 1 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                Question 1 · Priority Tension
              </span>
              <span className="text-[10px] text-slate-400">Minute 0–4</span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              "{clientName}, you prioritized Liam & Josh's 529 college fund, while {partnerName} prioritized term life protection. If you had to fund one in full and the other 50/50 this quarter, where does true peace of mind land?"
            </p>
          </div>

          {/* Question 2 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                Question 2 · Emotional Liquidity
              </span>
              <span className="text-[10px] text-slate-400">Minute 5–9</span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              "You have $150,800 in liquid cash — $60,222 above your 6-month safety net. What would it take emotionally to deploy $18,000 to eliminate the 18% credit card permanently?"
            </p>
          </div>

          {/* Question 3 */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-indigo-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">
                Question 3 · Protection Blindspot
              </span>
              <span className="text-[10px] text-slate-400">Minute 10–14</span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed">
              "You both flagged the umbrella liability question. Have you considered that your home equity and rising net worth make you a target for claims above standard auto limits?"
            </p>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200">
          💡 <strong>Pro Advisor Tip:</strong> Addressing these 3 human tension points secures client commitment and execution in the first 15 minutes of the call.
        </div>
      </div>

      {/* ── Real-Time Telemetry Log ───────────────────────────────────────── */}
      <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-[10px] font-mono space-y-1.5">
        <div className="flex items-center justify-between text-slate-400">
          <span className="uppercase font-bold tracking-wider">Session Telemetry Stream</span>
          <span className="text-emerald-400">Active</span>
        </div>
        <div className="text-slate-400 space-y-1">
          <div>• session_init: case_id="{activeCase.id}"</div>
          <div>• style_selected: "visual" (Melanie), "analytical" (Timothy)</div>
          <div>• high_revolving_gate_cleared: action="pay_card"</div>
          <div>• consensus_status: 2_agreements, 1_tie_breaker</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#171827] text-white flex flex-col items-center">
      {/* ── Top Bar with Projector Split Screen Toggle ─────────────────────── */}
      <div className="w-full max-w-4xl px-4 pt-4 pb-2 flex flex-col items-center gap-3">
        <SplitScreenToggle
          mode={splitMode}
          onModeChange={setSplitMode}
          target={splitTarget}
          onTargetChange={setSplitTarget}
          partner1Name={clientName}
          partner2Name={partnerName}
        />

        {/* In Single Mobile mode: quick tab switcher to preview either view */}
        {splitMode === 'single' && (
          <div className="w-full max-w-[420px] grid grid-cols-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('plan')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'plan'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Client Action Plan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'advisor'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Advisor Dashboard</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Main View Container (Single or Split) ─────────────────────────── */}
      <SplitScreenContainer
        mode={splitMode}
        leftTitle={`${clientName}’s Action Plan`}
        leftSubtitle="Client View"
        leftContent={renderClientPlanView}
        rightTitle="Advisor Pre-Meeting View"
        rightSubtitle="Sherpas Telemetry"
        rightContent={renderAdvisorView}
        singleActiveTab={activeTab === 'plan' ? 'left' : 'right'}
        className="pb-8"
      />

      {/* ── Grounding Inspector Modal ─────────────────────────────────────── */}
      <GroundingInspector
        grounding={activeGrounding}
        onClose={() => setActiveGrounding(null)}
      />
    </div>
  );
}
