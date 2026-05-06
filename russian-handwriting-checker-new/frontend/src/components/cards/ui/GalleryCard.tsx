import { useState } from 'react';
import { Globe, User2, Loader2, Check, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import type { GalleryFn } from '@/types';

interface GalleryCardProps {
  fn: GalleryFn;
  isCopied: boolean;
  isCopying: boolean;
  onCopy: () => void;
}

export const GalleryCard = ({ fn, isCopied, isCopying, onCopy }: GalleryCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-slate-800 text-sm">{fn.name}</p>
              <span className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full shrink-0">
                <Globe className="h-2.5 w-2.5" />v{fn.version_number}
              </span>
            </div>

            {fn.description && (
              <p className="text-sm text-slate-500 leading-relaxed mb-2">{fn.description}</p>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <User2 className="h-3 w-3 shrink-0" />
              <span>{fn.author_display_name}</span>
            </div>
          </div>

          <button
            onClick={onCopy}
            disabled={isCopied || isCopying}
            className={`cursor-pointer shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:cursor-default ${
              isCopied
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white'
            }`}
          >
            {isCopying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isCopied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            {isCopied ? 'Добавлено' : 'Добавить себе'}
          </button>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="cursor-pointer mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          {expanded ? 'Скрыть промпт' : 'Показать системный промпт'}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
              Системный промпт
            </p>
            <pre className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-100 overflow-auto max-h-48 whitespace-pre-wrap font-mono leading-relaxed">
              {fn.system_prompt}
            </pre>
          </div>
          {fn.user_template && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                Шаблон запроса
              </p>
              <pre className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-100 font-mono">
                {fn.user_template}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
