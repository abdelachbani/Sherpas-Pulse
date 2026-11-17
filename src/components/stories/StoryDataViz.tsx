/** A sourced score on its explicit 0–100 scale. */
export function StoryScore({ value, label }: { value: number; label: string }) {
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return <div className="story-score" role="img" aria-label={`${label}: ${value} out of 100`}>
    <div className="story-score-track"><div className="story-score-fill" style={{ width: `${value}%` }} /></div>
    <div className="story-score-axis" aria-hidden="true"><span>0</span><span>100</span></div>
  </div>;
}

export function StoryTimeline({ years }: { years: number[] }) {
  const firstYear = Math.min(...years);
  const lastYear = Math.max(...years);
  if (years.length < 2 || firstYear === lastYear) return null;

  return <div className="story-timeline" aria-hidden="true">
    <div className="story-timeline-track">
      {years.map((year) => <span key={year} style={{ left: `${(year - firstYear) / (lastYear - firstYear) * 100}%` }} />)}
    </div>
    <div className="story-score-axis"><span>{firstYear}</span><span>{lastYear}</span></div>
  </div>;
}
