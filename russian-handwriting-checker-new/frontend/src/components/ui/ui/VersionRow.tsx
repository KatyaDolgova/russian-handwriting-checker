import { useState } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { formatDate } from '@/utils';
import type { FnVersion } from '@/types';

export const VersionRow = ({
  ver,
  isLatest,
  onDelete,
}: {
  ver: FnVersion;
  isLatest: boolean;
  onDelete?: (id: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer flex-1 flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors min-w-0"
        >
          <span
            className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
              isLatest ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
            }`}
          >
            v{ver.version_number}
          </span>
          <span className="text-xs text-slate-400 shrink-0">{formatDate(ver.created_at)}</span>
          {ver.change_note ? (
            <span className="text-xs text-slate-600 flex-1 truncate">{ver.change_note}</span>
          ) : (
            <span className="text-xs text-slate-300 flex-1 italic">без заметки</span>
          )}
          {isLatest && <span className="shrink-0 text-xs text-indigo-500">текущая</span>}
          {open ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          )}
        </button>

        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setConfirmDelete((v) => !v);
            }}
            className={`cursor-pointer p-2 mr-1 rounded-lg transition-colors shrink-0 ${
              confirmDelete
                ? 'text-red-500 bg-red-50'
                : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
            }`}
            title="Удалить версию"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {confirmDelete && (
        <div className="px-3 pb-2 flex items-center gap-2">
          <span className="text-xs text-red-600 flex-1">Удалить v{ver.version_number}?</span>
          <button
            onClick={() => setConfirmDelete(false)}
            className="cursor-pointer text-xs px-2 py-1 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          >
            Нет
          </button>
          <button
            onClick={() => onDelete?.(ver.id)}
            className="cursor-pointer text-xs px-2 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
          >
            Да
          </button>
        </div>
      )}

      {open && (
        <div className="px-3 pb-3 space-y-2 bg-slate-50">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 mt-2">
              Системный промпт
            </p>
            <pre className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100 overflow-auto max-h-36 whitespace-pre-wrap font-mono leading-relaxed">
              {ver.system_prompt}
            </pre>
          </div>
          {ver.user_template && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                Шаблон
              </p>
              <pre className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100 font-mono">
                {ver.user_template}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
