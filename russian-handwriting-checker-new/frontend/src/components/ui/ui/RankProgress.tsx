import { RANK_THRESHOLDS } from '@/constants';

export const RankProgress = ({ total }: { total: number }) => {
  const tier = RANK_THRESHOLDS.find((t) => total >= t.min && total < t.max);
  if (!tier) return null;
  const pct = Math.round(((total - tier.min) / (tier.max - tier.min)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>До следующего уровня</span>
        <span>
          {total} / {tier.next}
        </span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">Ещё {tier.next - total} проверок</p>
    </div>
  );
};
