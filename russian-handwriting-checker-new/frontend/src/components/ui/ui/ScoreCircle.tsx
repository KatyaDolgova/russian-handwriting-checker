export const ScoreCircle = ({ score, max }: { score: number | null; max?: number | null }) => {
  if (score == null) {
    return (
      <div className="w-12 h-12 rounded-xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300 font-bold text-base shrink-0">
        —
      </div>
    );
  }
  const pct = max != null && max > 0 ? score / max : 0;
  const color =
    pct >= 0.8
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : pct >= 0.5
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-red-600 bg-red-50 border-red-200';
  return (
    <div
      className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base shrink-0 ${color}`}
    >
      {score}
    </div>
  );
};
