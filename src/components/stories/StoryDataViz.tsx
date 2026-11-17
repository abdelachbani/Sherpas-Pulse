import type { PillarScore } from '../../types';
import { FinancialText } from '../shared/FinancialText';

/** A score is only shown when supplied by the case. */
export function ScoreRing({ score }: { score: number }) {
  const bounded = Math.max(0, Math.min(100, score));
  const circumference = 2 * Math.PI * 43;
  return (
    <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="8" />
          <circle cx="50" cy="50" r="43" fill="none" stroke="#819cff" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - bounded / 100)} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-white">{score}</span>
      </div>
      <div><p className="text-sm font-medium text-[#b9c7ff]">Health Score</p><p className="mt-1 text-sm text-slate-300">{score} out of 100</p></div>
    </div>
  );
}

export function PillarBars({ pillars }: { pillars: PillarScore[] }) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5" aria-label="Pillar scores">
      <h2 className="text-base font-semibold text-white">Pillar scores</h2>
      {pillars.map((p) => (
        <div key={p.pillar} className="space-y-2">
          <div className="flex justify-between gap-3 text-sm"><span className="capitalize text-slate-200"><FinancialText text={p.pillar.replace(/-/g, ' ')} /></span><span className="font-semibold text-white">{p.score}/100</span></div>
          <div role="progressbar" aria-label={`${p.pillar} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, p.score))} className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#819cff]" style={{ width: `${Math.max(0, Math.min(100, p.score))}%` }} />
          </div>
        </div>
      ))}
    </section>
  );
}
