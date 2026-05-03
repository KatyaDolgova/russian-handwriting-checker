import { useEffect, useState, useCallback } from 'react';
import {
  Search, Loader2, Globe, User2, ChevronDown, ChevronUp,
  Plus, Check, BookOpen,
} from 'lucide-react';
import api from '../api';
import { useToast } from './Toast';

interface GalleryFn {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  author_display_name: string;
  author_user_id: string | null;
  version_number: number;
}

function GalleryCard({
  fn,
  isCopied,
  isCopying,
  onCopy,
}: {
  fn: GalleryFn;
  isCopied: boolean;
  isCopying: boolean;
  onCopy: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start gap-4">
          {/* Основная информация */}
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

          {/* Кнопка добавить */}
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

        {/* Кнопка раскрыть промпт */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="cursor-pointer mt-3 flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5" />
            : <ChevronDown className="h-3.5 w-3.5" />
          }
          {expanded ? 'Скрыть промпт' : 'Показать системный промпт'}
        </button>
      </div>

      {/* Раскрытое содержимое */}
      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3 bg-slate-50/50">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Системный промпт</p>
            <pre className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-100 overflow-auto max-h-48 whitespace-pre-wrap font-mono leading-relaxed">
              {fn.system_prompt}
            </pre>
          </div>
          {fn.user_template && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Шаблон запроса</p>
              <pre className="text-xs text-slate-600 bg-white rounded-xl p-3 border border-slate-100 font-mono">
                {fn.user_template}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FunctionGallery() {
  const toast = useToast();
  const [functions, setFunctions] = useState<GalleryFn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  // Дебаунс поиска
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api.get('/api/functions/gallery', { params: { search: debouncedSearch } })
      .then(r => setFunctions(r.data))
      .catch(() => toast.error('Не удалось загрузить галерею'))
      .finally(() => setLoading(false));
  }, [debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleCopy = async (fn: GalleryFn) => {
    setCopyingId(fn.id);
    try {
      await api.post(`/api/functions/${fn.id}/copy`);
      setCopiedIds(prev => new Set(prev).add(fn.id));
      toast.success(`«${fn.name}» добавлена в «Мои функции»`);
    } catch {
      toast.error('Не удалось добавить функцию');
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Шапка */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Функции, опубликованные другими пользователями. Добавьте любую к себе — она появится в разделе «Мои функции» и станет доступна для редактирования и использования.
          </p>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию, описанию или автору..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        )}
      </div>

      {/* Контент */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />Загрузка галереи...
        </div>
      ) : functions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-slate-500 font-medium">
            {debouncedSearch ? 'Ничего не найдено' : 'Галерея пока пуста'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {debouncedSearch
              ? 'Попробуйте изменить запрос'
              : 'Когда пользователи опубликуют свои функции — они появятся здесь'
            }
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">
            {debouncedSearch
              ? `Найдено: ${functions.length}`
              : `Всего опубликовано: ${functions.length}`
            }
          </p>
          <div className="space-y-3">
            {functions.map(fn => (
              <GalleryCard
                key={fn.id}
                fn={fn}
                isCopied={copiedIds.has(fn.id)}
                isCopying={copyingId === fn.id}
                onCopy={() => handleCopy(fn)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
