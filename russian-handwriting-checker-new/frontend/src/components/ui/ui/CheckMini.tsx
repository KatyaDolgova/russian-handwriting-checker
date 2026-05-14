import type { CheckRecord, Folder } from '@/types';
import { formatDate } from '@/utils';
import { FolderClosed } from 'lucide-react';

export const CheckMini = ({ check, folders }: { check: CheckRecord; folders: Folder[] }) => {
  const folderName = check.folder_id ? folders.find((f) => f.id === check.folder_id)?.name : null;
  const subtitle = check.title || (check.original_text || check.corrected_text || '').slice(0, 70);

  let badgeContent: string;
  let color: string;
  if (check.pass_fail != null) {
    const passed = check.pass_fail === 'зачёт';
    badgeContent = passed ? 'З' : 'Н';
    color = passed
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
      : 'text-red-600 bg-red-50 border-red-200';
  } else if (check.score == null) {
    badgeContent = '—';
    color = 'text-slate-300 bg-slate-50 border-slate-200';
  } else {
    const pct = check.score_max != null && check.score_max > 0 ? check.score / check.score_max : 0;
    badgeContent = String(check.score);
    color =
      pct >= 0.8
        ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
        : pct >= 0.5
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : 'text-red-600 bg-red-50 border-red-200';
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <div
        title={check.pass_fail ?? undefined}
        className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold text-sm shrink-0 ${color}`}
      >
        {badgeContent}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm text-slate-600 truncate">{check.filename}</p>
          {folderName && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
              <FolderClosed className="h-2.5 w-2.5" />
              {folderName}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{subtitle}</p>}
      </div>
      <p className="text-xs text-slate-300 shrink-0">
        {formatDate(check.work_date || check.created_at)}
      </p>
    </div>
  );
};
