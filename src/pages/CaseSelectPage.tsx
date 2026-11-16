import { useNavigate } from 'react-router-dom';
import { Users, User, MapPin, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { CASES } from '../lib/mcp/cases';
import type { CaseData } from '../types';

// ─── Score badge colour logic ──────────────────────────────────────────────────
function scoreBadgeClass(colour: string, score: number): string {
  // Prefer the colour field from the JSON; fall back to score thresholds
  if (colour === 'green'  || score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (colour === 'yellow' || (score >= 60 && score < 70)) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (colour === 'orange' || (score >= 50 && score < 60)) return 'bg-orange-100 text-orange-800 border-orange-200';
  return 'bg-red-100 text-red-800 border-red-200';
}

function scoreDotClass(colour: string, score: number): string {
  if (colour === 'green'  || score >= 80) return 'bg-green-500';
  if (colour === 'yellow' || (score >= 60 && score < 70)) return 'bg-yellow-400';
  if (colour === 'orange' || (score >= 50 && score < 60)) return 'bg-orange-400';
  return 'bg-red-500';
}

// ─── Household display helpers ────────────────────────────────────────────────
function householdDisplayName(c: CaseData): string {
  const adults = c.financialHealth.case.household.filter(
    (m) => m.role === 'client' || m.role === 'co-client',
  );
  if (adults.length === 1) return adults[0]!.first_name;
  return adults.map((a) => a.first_name).join(' & ');
}

// ─── Individual card ──────────────────────────────────────────────────────────
function CaseCard({ caseData }: { caseData: CaseData }) {
  const navigate = useNavigate();
  const fh = caseData.financialHealth;
  const score  = fh.score.published_score;
  const colour = fh.score.colour ?? '';
  const band   = fh.score.band;
  const city   = fh.case.city;
  const state  = fh.case.state;
  const isCouple = caseData.householdType === 'couple';

  return (
    <article
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform cursor-pointer"
      onClick={() => navigate(`/case/${caseData.id}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={clsx(
            'flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            isCouple ? 'bg-indigo-50' : 'bg-sky-50',
          )}>
            {isCouple
              ? <Users className="w-5 h-5 text-indigo-500" />
              : <User  className="w-5 h-5 text-sky-500" />}
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {householdDisplayName(caseData)}
            </h2>
            <span className={clsx(
              'inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
              isCouple ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                       : 'bg-sky-50 text-sky-600 border-sky-100',
            )}>
              {isCouple ? 'Couple' : 'Single'}
            </span>
          </div>
        </div>

        {/* Score badge */}
        <div className={clsx(
          'flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold',
          scoreBadgeClass(colour, score),
        )}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', scoreDotClass(colour, score))} />
          {score}
        </div>
      </div>

      {/* Band & location */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="capitalize font-medium">{band}</span>
        {(city || state) && (
          <>
            <span className="text-gray-200">·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {[city, state].filter(Boolean).join(', ')}
            </span>
          </>
        )}
      </div>

      {/* Pillar mini-bars */}
      <div className="space-y-1">
        {fh.score.pillars.map((p) => (
          <div key={p.pillar} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 w-28 flex-shrink-0 truncate">
              {p.pillar}
            </span>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={clsx('h-full rounded-full', p.score >= 80 ? 'bg-green-400' : p.score >= 60 ? 'bg-yellow-400' : 'bg-red-400')}
                style={{ width: `${p.score}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 w-6 text-right">{p.score}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="mt-1 w-full flex items-center justify-center gap-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        onClick={(e) => { e.stopPropagation(); navigate(`/case/${caseData.id}`); }}
      >
        Start session
        <ChevronRight className="w-4 h-4" />
      </button>
    </article>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CaseSelectPage() {
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 pt-10 pb-5 max-w-[420px] mx-auto">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">⛰️</span>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sherpas Pulse</h1>
        </div>
        <p className="text-sm text-gray-500">Select a household to begin the financial health session.</p>
      </div>

      {/* Case list */}
      <div className="max-w-[420px] mx-auto px-4 mt-4 space-y-3">
        {CASES.map((c) => (
          <CaseCard key={c.id} caseData={c} />
        ))}
      </div>
    </div>
  );
}
