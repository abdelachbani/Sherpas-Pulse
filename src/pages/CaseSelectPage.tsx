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
      className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col gap-5 transition-all hover:border-indigo-300 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer"
      onClick={() => navigate(`/case/${caseData.id}`)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={clsx(
            'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center',
            isCouple ? 'bg-indigo-50' : 'bg-indigo-50',
          )}>
            {isCouple
              ? <Users className="w-5 h-5 text-indigo-500" />
              : <User  className="w-5 h-5 text-indigo-500" />}
          </span>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-900 text-base leading-tight truncate">
              {householdDisplayName(caseData)}
            </h2>
            <span className={clsx(
              'inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border',
              isCouple ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                       : 'bg-indigo-50 text-indigo-600 border-indigo-100',
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
            <span className="text-gray-500">·</span>
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {[city, state].filter(Boolean).join(', ')}
            </span>
          </>
        )}
      </div>

      {/* Pillar mini-bars */}
      <div className="space-y-2.5">
        {fh.score.pillars.map((p) => (
          <div key={p.pillar} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5">
            <span className="text-xs text-slate-600">
              {p.pillar}
            </span>
            <div className="col-span-2 row-start-2 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className={clsx('h-full rounded-full', p.score >= 80 ? 'bg-green-400' : p.score >= 60 ? 'bg-yellow-400' : 'bg-red-400')}
                style={{ width: `${p.score}%` }}
              />
            </div>
            <span className="text-xs text-slate-600 col-start-2 row-start-1 text-right">{p.score}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        className="mt-auto w-full flex items-center justify-center gap-1 bg-[#171827] hover:bg-[#4565d6] text-white text-sm font-medium py-3 rounded-xl transition-colors"
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
    <div className="min-h-dvh bg-[#f4f5f6] pb-12 text-[#141419]">
      <main className="mx-auto max-w-7xl px-5 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#4565d6]">Household sessions</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#171827] sm:text-4xl">Select a household</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Select a household to begin the financial health session.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {CASES.map((c) => (
            <CaseCard key={c.id} caseData={c} />
          ))}
        </div>
      </main>
    </div>
  );
}
