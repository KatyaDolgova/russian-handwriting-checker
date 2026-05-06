interface ScoreBadgeProps {
  score: string;
  label?: string | null;
  max: string;
}

export const ScoreBadge = ({ score, label, max }: ScoreBadgeProps) => {
  if (label) {
    const isPass =
      label.toLowerCase().includes('зачёт') && !label.toLowerCase().includes('незачёт');
    return (
      <div
        className={`inline-flex items-center px-4 py-2 rounded-2xl border font-bold text-lg ${isPass ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}
      >
        {label}
      </div>
    );
  }
  const s = parseFloat(score) || 0;
  const m = parseFloat(max) || 100;
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
