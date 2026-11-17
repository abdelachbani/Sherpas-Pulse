/**
 * src/components/shared/DataCard.tsx
 *
 * Reusable card: label + big number + unit + optional trend arrow.
 */

import { TrendingDown, TrendingUp } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
  className?: string;
}

export function DataCard({ label, value, unit, trend, highlight, className = '' }: Props) {
  return (
    <div
      className={`rounded-2xl bg-slate-800 border border-slate-700 px-4 py-3 ${
        highlight ? 'border-blue-500/50 bg-blue-900/20' : ''
      } ${className}`}
    >
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <div className="flex items-end gap-1">
        {unit && <span className="text-slate-400 text-lg mb-0.5">{unit}</span>}
        <span className="text-3xl font-bold text-white leading-none">{value}</span>
        {trend && trend !== 'neutral' && (
          <span className={`mb-1 ml-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
