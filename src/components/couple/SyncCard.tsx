import type { SyncAgreement, SyncTieBreaker, GroundingRef } from '../../types';
import { FinancialText } from '../shared/FinancialText';

interface SyncCardProps {
  item: SyncAgreement | SyncTieBreaker;
  partner1Name?: string;
  partner2Name?: string;
  index?: number;
  topicNumber?: number;
  priority?: number;
  onInspect?: (ref: GroundingRef) => void;
}

export function SyncCard({ item, partner1Name, partner2Name, index = 0, priority }: SyncCardProps) {
  const agreed = item.status === 'agreement';
  return (
    <article className={`rounded-2xl border p-5 bg-slate-900 ${agreed ? 'border-emerald-500/40' : 'border-amber-500/40'}`}>
      <p className={`text-xs uppercase tracking-wider font-bold ${agreed ? 'text-emerald-300' : 'text-amber-300'}`}>{agreed ? 'Shared priority' : 'Different choices'}</p>
      <h3 className="mt-2 text-lg font-semibold text-white"><FinancialText text={item.title} /></h3>
      {item.status === 'agreement' ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-slate-300"><FinancialText text={item.explanation} /></p>
          <div className="mt-4 rounded-xl bg-slate-800 p-4 text-sm text-slate-200">
            <p>{partner1Name} &amp; {partner2Name}</p>
            <p className="mt-1 font-semibold text-white">{priority != null ? `Priority #${priority}` : ''}</p>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[[item.partner1Name, item.partner1Priority], [item.partner2Name, item.partner2Priority]].map(([name, rank]) => (
              <div key={String(name)} className="rounded-xl bg-slate-800 p-4 text-sm text-slate-200">
                <p className="font-semibold text-white">{name}</p><p className="mt-1">Priority #{rank}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-300"><FinancialText text={item.advisorQuestion} /></p>
        </>
      )}
    </article>
  );
}
export default SyncCard;
