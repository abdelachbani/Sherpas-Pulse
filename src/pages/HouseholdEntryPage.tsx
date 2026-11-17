/**
 * src/pages/HouseholdEntryPage.tsx
 *
 * "Two Paces, One Plan" Entry:
 *  - Automatically detects couple vs. single household from MCP data
 *  - Fully responsive mobile scroll layout to prevent any cut-offs
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
  BarChart3,
  Heart,
  List,
  ChevronRight,
  Smartphone,
  Check,
  QrCode,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { CASES } from '../lib/mcp/cases';
import type { ViewingStyle } from '../types';
import { PartnerQrModal } from '../components/shared/PartnerQrModal';

export default function HouseholdEntryPage() {
  const { caseId } = useParams<{ caseId: string }>();
  if (!CASES.some((item) => item.id === caseId)) {
    return <main className="session-page min-h-dvh bg-[#171827] text-white p-8"><div className="max-w-3xl mx-auto"><h1 className="text-2xl font-semibold">Household not found</h1><p className="mt-3 text-sm text-slate-300">This household link is unavailable. Choose a household to continue.</p><a className="inline-flex min-h-11 items-center mt-6 text-indigo-300 underline" href="/">Choose a household</a></div></main>;
  }
  return <HouseholdEntryPageContent key={caseId} />;
}

function HouseholdEntryPageContent() {
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
  const [showQrModal, setShowQrModal] = useState(false);

  const activeCase = (currentCase?.id === caseId ? currentCase : CASES.find((c) => c.id === caseId))!;

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
    <div className="session-page min-h-dvh bg-[#f4f5f6] text-[#141419] flex flex-col justify-between max-w-2xl mx-auto px-5 py-8 sm:px-10 sm:py-12 select-none relative overflow-y-auto">

      {/* ── Top Header ──────────────────────────────────────────────────────── */}
      <div className="pt-2 relative z-10 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-500 hover:text-indigo-600 transition-colors mb-6 block"
        >
          ← Switch household
        </button>

        <div className="flex items-center gap-2">
          <span className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            {isCouple ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
          </span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              {isCouple ? 'Two Paces, One Plan' : 'Single Trade-off Simulator'}
            </span>
            <h1 className="text-2xl font-semibold text-slate-900 leading-tight">
              {isCouple
                ? `${client?.first_name} & ${coClient?.first_name}`
                : client?.first_name}
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600 mt-4 leading-relaxed">
          {isCouple
            ? 'Each partner explores on their own phone at their own pace. We bring your choices together into a Family Consensus.'
            : 'Explore your plan milestones and compare the choices that matter to you.'}
        </p>
      </div>

      {/* ── Center Content ──────────────────────────────────────────────────── */}
      <div className="my-auto py-8 relative z-10 space-y-7">
        {/* Step 1: Who is reviewing? (Couples only) */}
        {isCouple && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>1. Who is reviewing now?</span>
              <span className="text-xs text-slate-500">Select partner</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Partner 1 (Timothy) */}
              <button
                onClick={() => setSelectedPartner('primary')}
                aria-pressed={selectedPartner === 'primary'}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedPartner === 'primary'
                    ? 'bg-indigo-50 border-indigo-500 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">{client?.first_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Age {client?.age} · {client?.risk_profile}
                </div>
              </button>

              {/* Partner 2 (Melanie) */}
              <button
                onClick={() => setSelectedPartner('secondary')}
                aria-pressed={selectedPartner === 'secondary'}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedPartner === 'secondary'
                    ? 'bg-indigo-50 border-indigo-500 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-900">{coClient?.first_name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Age {coClient?.age} · {coClient?.risk_profile}
                </div>
              </button>
            </div>

            {/* Asynchronous share link & QR Pairing */}
            <div className="pt-0.5 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  handleCopyShareLink(
                    selectedPartner === 'primary'
                      ? coClient?.first_name || 'partner'
                      : client?.first_name || 'partner'
                  )
                }
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 hover:text-indigo-600 hover:border-indigo-200 transition-colors cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-700 font-semibold">Link copied!</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Copy partner link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Scan QR on second phone"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scan QR</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose viewing pace / style */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>{isCouple ? '2. How would you like to review?' : 'How would you like to review?'}</span>
            <span className="text-xs text-slate-500">Same plan, different presentation</span>
          </div>

          <div className="space-y-2">
            {/* Visual / Peace of Mind */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStyle('visual')}
              aria-pressed={selectedStyle === 'visual'}
              className={`w-full text-left p-5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedStyle === 'visual'
                  ? 'bg-indigo-50 border-indigo-500 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
              }`}
            >
              <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                <Heart className="w-3.5 h-3.5" />
              </span>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Visual</span>
                  {selectedStyle === 'visual' && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                  See key figures first, with simple score bars and paired short details.
                </div>
              </div>
            </motion.button>

            {/* Analytical */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedStyle('analytical')}
              aria-pressed={selectedStyle === 'analytical'}
              className={`w-full text-left p-5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                selectedStyle === 'analytical'
                  ? 'bg-indigo-50 border-indigo-500 text-slate-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
              }`}
            >
              <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600 mt-0.5">
                <BarChart3 className="w-3.5 h-3.5" />
              </span>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-900 flex items-center justify-between">
                  <span>Analytical</span>
                  {selectedStyle === 'analytical' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                  Review all plan details one at a time, followed by each chapter’s highlight.
                </div>
              </div>
            </motion.button>
            <button type="button" onClick={() => setSelectedStyle('express')} aria-pressed={selectedStyle === 'express'} className={`w-full text-left p-5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${selectedStyle === 'express' ? 'bg-indigo-50 border-indigo-500 text-slate-900' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'}`}>
              <span className="p-1.5 rounded-xl bg-indigo-100 text-indigo-600 mt-0.5"><List className="w-3.5 h-3.5" /></span>
              <span className="flex-1"><span className="text-xs font-bold text-slate-900 block">Express</span><span className="text-xs text-slate-500 mt-0.5 block leading-snug">See one key detail or highlight per chapter in six screens.</span></span>
              {selectedStyle === 'express' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* Plan health snapshot banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div className="text-xs text-slate-500 uppercase font-semibold">Published Health Score</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {fh.score.published_score}/100 <span className="text-xs text-amber-700 font-medium">({fh.score.band})</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500 uppercase font-semibold">Pillars Analyzed</div>
            <div className="text-xs font-bold text-emerald-700 mt-0.5">{fh.score.pillars.length} Pillars Verified</div>
          </div>
        </div>
      </div>

      {/* ── Bottom CTA (Shrink-0) ───────────────────────────────────────────── */}
      <div className="pb-4 pt-2 relative z-10 shrink-0">
        <button
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Explore your plan</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Partner QR Pairing Modal */}
      {isCouple && (
        <PartnerQrModal
          isOpen={showQrModal}
          onClose={() => setShowQrModal(false)}
          partnerName={selectedPartner === 'primary' ? coClient?.first_name || 'Partner' : client?.first_name || 'Partner'}
          partnerRole={selectedPartner === 'primary' ? 'Peace of Mind Rhythm' : 'Analytical Rhythm'}
          url={typeof window !== 'undefined'
            ? `${window.location.origin}/case/${activeCase.id}?user=${(selectedPartner === 'primary' ? coClient?.first_name : client?.first_name)?.toLowerCase() || ''}`
            : `/case/${activeCase.id}?user=${(selectedPartner === 'primary' ? coClient?.first_name : client?.first_name)?.toLowerCase() || ''}`
          }
        />
      )}
    </div>
  );
}
