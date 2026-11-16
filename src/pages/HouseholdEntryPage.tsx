/**
 * src/pages/HouseholdEntryPage.tsx
 *
 * "Two Paces, One Plan" Entry:
 *  - Automatically detects couple vs. single household from MCP data
 *  - For Couples: Allows each partner to pick their persona (Timothy / Melanie)
 *    and preferred viewing pace (Analytical vs. Peace of Mind)
 *  - Provides individual mobile links (?user=timothy / ?user=melanie)
 *  - For Singles: Personalized intro with key financial score and trade-off summary
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  User,
  Shield,
  BarChart3,
  Heart,
  ChevronRight,
  Sparkles,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import type { ViewingStyle } from '../types';

export default function HouseholdEntryPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const setCase = useAppStore((s) => s.setCase);
  const currentCase = useAppStore((s) => s.currentCase);
  const setPartner = useAppStore((s) => s.setPartner);
  const setViewingStyle = useAppStore((s) => s.setViewingStyle);
  const addTelemetryEvent = useAppStore((s) => s.addTelemetryEvent);

  const [selectedPartner, setSelectedPartner] = useState<'primary' | 'secondary'>('primary');
  const [selectedStyle, setSelectedStyle] = useState<ViewingStyle>('visual');
  const [copiedLink, setCopiedLink] = useState(false);

  const activeCase = currentCase ?? CASES.find((c) => c.id === caseId) ?? CASES[0];

  useEffect(() => {
    if (caseId && (!currentCase || currentCase.id !== caseId)) {
      setCase(caseId);
    }
  }, [caseId, currentCase, setCase]);

  // Handle direct ?user=melanie or ?user=timothy query param
  useEffect(() => {
    const userParam = searchParams.get('user')?.toLowerCase();
    if (userParam && activeCase?.financialHealth?.case?.household) {
      const coClient = activeCase.financialHealth.case.household.find((m) => m.role === 'co-client');
      if (coClient && userParam.includes(coClient.first_name.toLowerCase())) {
        setSelectedPartner('secondary');
      }
    }
  }, [searchParams, activeCase]);

  if (!activeCase) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-white">
        Loading household plan...
      </div>
    );
  }

  const fh = activeCase.financialHealth;
  const isCouple = activeCase.householdType === 'couple';
  const client = fh.case.household.find((m) => m.role === 'client');
  const coClient = fh.case.household.find((m) => m.role === 'co-client');

  function handleStart() {
    setPartner(selectedPartner);
    setViewingStyle(selectedStyle);

    addTelemetryEvent({
      type: 'style_select',
      payload: {
        partner: selectedPartner,
        style: selectedStyle,
        caseId: activeCase.id,
      },
      timestamp: Date.now(),
    });

    navigate(`/case/${activeCase.id}/stories`);
  }

  function handleCopyShareLink(partnerName: string) {
    const url = `${window.location.origin}/case/${activeCase.id}?user=${partnerName.toLowerCase()}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  return (
    <div className="min-h-dvh bg-slate-950 text-white flex flex-col justify-between max-w-[420px] mx-auto p-6 select-none relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-72 h-72 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="pt-4 relative z-10">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-white transition-colors mb-4 block"
        >
          ← Switch household
        </button>

        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            {isCouple ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </span>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              {isCouple ? 'Two Paces, One Plan' : 'Single Trade-off Simulator'}
            </span>
            <h1 className="text-xl font-black text-white leading-tight">
              {isCouple
                ? `${client?.first_name} & ${coClient?.first_name}`
                : client?.first_name}
            </h1>
          </div>
        </div>

        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {isCouple
            ? 'Each partner can explore the plan on their own phone at their own pace. We’ll bring your priorities together into a Family Consensus.'
            : 'Explore your customized plan milestones and simulate trade-offs with 100% deterministic plan grounding.'}
        </p>
      </div>

      {/* ── Center Content ──────────────────────────────────────────────────── */}
      <div className="my-auto py-4 relative z-10 space-y-5">
        {/* Step 1: Who is reviewing? (Couples only) */}
        {isCouple && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>1. Who is reviewing now?</span>
              <span className="text-[11px] text-slate-400">Select partner</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Partner 1 (Timothy) */}
              <button
                onClick={() => setSelectedPartner('primary')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedPartner === 'primary'
                    ? 'bg-indigo-600/40 border-indigo-400 text-white shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-bold text-white">{client?.first_name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Age {client?.age} · {client?.risk_profile}
                </div>
              </button>

              {/* Partner 2 (Melanie) */}
              <button
                onClick={() => setSelectedPartner('secondary')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedPartner === 'secondary'
                    ? 'bg-rose-600/40 border-rose-400 text-white shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-sm font-bold text-white">{coClient?.first_name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Age {coClient?.age} · {coClient?.risk_profile}
                </div>
              </button>
            </div>

            {/* Asynchronous share link */}
            <div className="pt-1">
              <button
                onClick={() =>
                  handleCopyShareLink(
                    selectedPartner === 'primary'
                      ? coClient?.first_name || 'partner'
                      : client?.first_name || 'partner'
                  )
                }
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Share link copied for partner’s phone!</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Send link for {selectedPartner === 'primary' ? coClient?.first_name : client?.first_name}’s phone</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose viewing pace / style */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>{isCouple ? '2. Pick your viewing rhythm' : 'Choose your viewing rhythm'}</span>
            <span className="text-[11px] text-slate-400">Customized experience</span>
          </div>

          <div className="space-y-2.5">
            {/* Visual / Peace of Mind */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStyle('visual')}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedStyle === 'visual'
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mt-0.5">
                <Heart className="w-4 h-4" />
              </span>
              <div className="flex-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Peace of Mind & Family 🌿</span>
                  {selectedStyle === 'visual' && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Focus on protecting the kids, peace of mind, and life milestones. Simple terms, no financial jargon.
                </div>
              </div>
            </motion.div>

            {/* Analytical */}
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStyle('analytical')}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedStyle === 'analytical'
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div className="flex-1">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Analytical & Direct Numbers 📊</span>
                  {selectedStyle === 'analytical' && <Check className="w-4 h-4 text-indigo-400" />}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  Deep dive into 18% APR savings, ROI on cash, tax deductions, and portfolio volatility analysis.
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Plan health snapshot banner */}
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Published Health Score</div>
            <div className="text-lg font-bold text-white mt-0.5">
              {fh.score.published_score}/100 <span className="text-xs text-amber-400 font-medium">({fh.score.band})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Pillars Analyzed</div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{fh.score.pillars.length} Pillars Verified</div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────────── */}
      <div className="pb-4 relative z-10">
        <button
          onClick={handleStart}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Launch Wrapped Experience</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
