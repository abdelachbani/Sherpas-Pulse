/**
 * src/components/shared/FridayDecisionMatrixModal.tsx
 *
 * Product Architectural Choices & Trade-offs:
 * Clear architectural rationale for what was built vs what was ruled out.
 */

import { X, CheckCircle2, XCircle, Sparkles, Scale, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function FridayDecisionMatrixModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="The Friday Decision Matrix"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl bg-slate-900 border border-slate-700 p-5 sm:p-6 text-white shadow-2xl shadow-black/80 space-y-4 no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Scale className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Why Sherpas Pulse?</h3>
              <p className="text-xs text-amber-300/90 font-mono">Architectural Choices & Trade-offs</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Intro */}
        <p className="text-xs text-slate-300 leading-relaxed">
          Sherpas Pulse was designed to solve the real friction between advisor and client when reviewing financial plans at home without an advisor present.
        </p>

        {/* What We Deliberately Ruled Out */}
        <div className="space-y-2.5">
          <h4 className="text-xs uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>What We Deliberately Ruled Out & Why</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <div className="font-bold text-rose-200">1. Generic PDF Chatbot ("Ask my plan anything")</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Why ruled out:</strong> Sherpas already has conversational AI. More importantly, when clients receive a plan at home, they suffer from <em>"blank page syndrome"</em>—they don't know what to ask when confused by Roth conversions or umbrella coverage. Chat is passive and reactive.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <div className="font-bold text-rose-200">2. 40-Minute Desktop Slide Deck Recaps</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Why ruled out:</strong> Advisors want meetings for human connection, not screen-sharing spreadsheets. Furthermore, Sherpas has zero mobile experience today. Mobile is where families actually open links on the couch.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-1">
              <div className="font-bold text-rose-200">3. Generative LLM Math & Calculations</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>Why ruled out:</strong> In wealth management, an AI hallucinating an 8% compounding return or incorrect tax bracket destroys fiduciary trust. We chose 100% deterministic TypeScript extraction from MCP data with Grounding Badges.
              </p>
            </div>
          </div>
        </div>

        {/* What We Chose to Build Instead */}
        <div className="space-y-2.5 pt-2">
          <h4 className="text-xs uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>What We Chose to Build Instead</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="font-bold text-emerald-200">📱 Mobile Wrapped Stories</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                25-second vertical cards (Overview, Advice, Living Map) clients actually finish.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="font-bold text-emerald-200">⚡ Zero-Prompt Calibration</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Detects hesitation pauses and opens everyday analogies + expert financial mechanics.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="font-bold text-emerald-200">👫 Two Paces, One Plan</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Analytical rhythm for Timothy; Peace of mind for Melanie; QR pairing across devices.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <div className="font-bold text-emerald-200">📊 Advisor Pre-Meeting Telemetry</div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Comprehension index (92%) and 3 human questions so advisors skip the slides.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Rationale
          </button>
        </div>
      </div>
    </div>
  );
}
