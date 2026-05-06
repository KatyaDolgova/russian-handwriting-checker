import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { formatDate } from '@/utils';
import type { FnVersion } from '@/types';

export const VersionRow = ({ ver, isLatest }: { ver: FnVersion; isLatest: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
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
