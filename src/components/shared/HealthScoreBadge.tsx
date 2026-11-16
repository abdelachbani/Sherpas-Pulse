/**
 * src/components/shared/HealthScoreBadge.tsx
 *
 * Circular score badge with Sherpas colour scheme:
 *   green  = 80+
 *   yellow = 60–79
 *   orange = 50–59
 *   red    < 50
 */

interface Props {
  score: number;
  size?: number; // px, default 64
}

export function HealthScoreBadge({ score, size = 64 }: Props) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, score)) / 100;
  const offset = circumference * (1 - pct);

  const color =
    score >= 80
      ? { ring: '#22c55e', text: 'text-green-400', bg: 'bg-green-900/40' }  // green
      : score >= 60
      ? { ring: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-900/40' } // yellow
      : score >= 50
      ? { ring: '#f97316', text: 'text-orange-400', bg: 'bg-orange-900/40' } // orange
      : { ring: '#ef4444', text: 'text-red-400', bg: 'bg-red-900/40' };     // red

  return (
    <div
      className={`relative flex items-center justify-center rounded-full ${color.bg}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0"
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={4}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.ring}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className={`relative text-sm font-black ${color.text}`}>{score}</span>
    </div>
  );
}
