import { scoreColor } from '@/utils';

export const ScoreBar = ({ pct }: { pct: number }) => {
  const bar = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold w-9 text-right tabular-nums ${scoreColor(pct)}`}>
        {pct}%
      </span>
    </div>
  );
};
