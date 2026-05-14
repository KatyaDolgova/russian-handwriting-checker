interface ScoreBadgeProps {
  score: string;
  label?: string | null;
  max: string;
}

export const ScoreBadge = ({ score, label, max }: ScoreBadgeProps) => {
  const cleanLabel = label && label.toLowerCase() !== 'none' ? label : null;

  if (cleanLabel) {
    const isPass =
      cleanLabel.toLowerCase().includes('зачёт') && !cleanLabel.toLowerCase().includes('незачёт');
    return (
      <div
        className={`inline-flex items-center px-4 py-2 rounded-2xl border font-bold text-lg ${isPass ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}
      >
        {cleanLabel}
      </div>
    );
  }

  const s = score.trim() !== '' ? parseFloat(score) : null;
  if (s == null || isNaN(s)) {
    return (
      <div className="inline-flex items-center px-4 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-slate-400 font-bold text-2xl">
        -
      </div>
    );
  }

  const m = parseFloat(max) || 5;
  const pct = m > 0 ? s / m : 0;
  const color =
    pct >= 0.8
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : pct >= 0.5
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-2xl ${color}`}
    >
      {s}
      <span className="text-sm font-normal opacity-60">/ {m}</span>
    </div>
  );
};
