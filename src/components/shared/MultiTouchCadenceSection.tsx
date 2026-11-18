import '../../pages/advisor-dashboard.css';
/**
 * src/components/shared/MultiTouchCadenceSection.tsx
 *
 * Interactive 4-Phase Multi-Touch Follow-Up Timeline:
 * Directly answers the hackathon prompt:
 * "What happens on day 3, when the doubts come? And on day 30?"
 */

import { useState } from 'react';
import { Calendar, Check, Clock, Copy, Mail, MessageSquare, Sparkles } from 'lucide-react';
import {
  generateMultiTouchCadence,
  downloadCalendarInvite,
  type Touchpoint,
} from '../../lib/multiTouchCadence';

interface Props {
  caseId: string;
  clientNames: string;
  primaryHesitationTerm: string;
  firstWinTitle: string;
  firstWinDollars?: string;
  agreedTopic?: string;
  divergedTopic?: string;
  isAdvisorView?: boolean;
}

export function MultiTouchCadenceSection({
  caseId,
  clientNames,
  primaryHesitationTerm,
  firstWinTitle,
  firstWinDollars,
  agreedTopic,
  divergedTopic,
  isAdvisorView = false,
}: Props) {
  const touchpoints = generateMultiTouchCadence({
    caseId,
    clientNames,
    primaryHesitationTerm,
    firstWinTitle,
    firstWinDollars,
    agreedTopic,
    divergedTopic,
  });

  const [activeTouchId, setActiveTouchId] = useState<Touchpoint['id']>('day-3');
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [calendarDownloaded, setCalendarDownloaded] = useState(false);

  const activeTouch = touchpoints.find((t) => t.id === activeTouchId) ?? touchpoints[1];

  const handleCopy = async () => {
    const textToCopy =
      channel === 'whatsapp'
        ? activeTouch.whatsappText
        : `Subject: ${activeTouch.emailSubject}\n\n${activeTouch.emailBody}`;

    setCopied(false);
    setCopyError(false);
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  };

  const handleDownloadCalendar = () => {
    downloadCalendarInvite({
      title: firstWinTitle,
      description: `Take five minutes to review this step in your Sherpas plan.${firstWinDollars ? `\nAmount listed: ${firstWinDollars}.` : ''}`,
      clientNames,
    });
    setCalendarDownloaded(true);
    setTimeout(() => setCalendarDownloaded(false), 3000);
  };

  return (
    <section className="cadence-section rounded-3xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-5 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">
                {isAdvisorView ? 'Multi-Touch Nudge Cadence' : 'Your Stay-on-Track Follow-up Cadence'}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Days 1 to 30
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAdvisorView
                ? 'Automated touchpoints preventing client drop-off before the Zoom meeting.'
                : 'Paced reminders to help you act without feeling pressured or forgotten.'}
            </p>
          </div>
        </div>

        {/* Channel Selector */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              setChannel('whatsapp');
              setCopied(false);
              setCopyError(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              channel === 'whatsapp'
                ? 'bg-indigo-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setChannel('email');
              setCopied(false);
              setCopyError(false);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              channel === 'email'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>
        </div>
      </div>

      {/* 4-Phase Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1" role="tablist" aria-label="Follow-up touchpoints">
        {touchpoints.map((t) => {
          const isSelected = t.id === activeTouchId;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setActiveTouchId(t.id);
                setCopied(false);
              setCopyError(false);
              }}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-950/70 border-indigo-500/80 shadow-md shadow-indigo-950/50'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-mono font-bold uppercase ${isSelected ? 'text-indigo-300' : 'text-slate-400'}`}>
                  Day {t.day}
                </span>
                {t.id === 'day-3' && (
                  <span className="p-0.5 rounded-full bg-amber-500/20 text-amber-400" title="Triggered by hesitation telemetry">
                    <Sparkles className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div className={`text-xs font-bold mt-1 line-clamp-1 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                {t.label.split(': ')[1]}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 line-clamp-1">{t.badge}</div>
            </button>
          );
        })}
      </div>

      {/* Active Touchpoint Message Preview */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between text-xs pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">{activeTouch.label}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400">{activeTouch.purpose}</span>
          </div>
          <span className="font-mono text-[10px] text-indigo-400 uppercase tracking-wider font-semibold">
            {channel === 'whatsapp' ? 'WhatsApp preview' : 'Email preview'}
          </span>
        </div>

        {channel === 'email' && (
          <div className="text-xs font-bold text-slate-200">
            Subject: <span className="font-normal text-indigo-300">{activeTouch.emailSubject}</span>
          </div>
        )}

        <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
          {channel === 'whatsapp' ? activeTouch.whatsappText : activeTouch.emailBody}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copied Day {activeTouch.day} {channel === 'whatsapp' ? 'WhatsApp' : 'Email'} Draft!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Day {activeTouch.day} {channel === 'whatsapp' ? 'WhatsApp' : 'Email'} Nudge</span>
            </>
          )}
        </button>

        {activeTouch.hasCalendarInvite && (
          <button
            type="button"
            onClick={handleDownloadCalendar}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            {calendarDownloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Calendar Invite (.ics) Downloaded!</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Add 5-Min Win to Calendar (.ics)</span>
              </>
            )}
          </button>
        )}
      </div>
      {copyError && <p role="alert" className="text-sm text-rose-300">Could not copy the draft. Check clipboard permissions and try again.</p>}
    </section>
  );
}
