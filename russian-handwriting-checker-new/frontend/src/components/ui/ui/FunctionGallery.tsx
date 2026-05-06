import { useEffect, useState, useCallback } from 'react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import api from '@/api';
import { useToast } from '@/components/ui';
import type { GalleryFn } from '@/types';
import { GalleryCard } from '@/components/cards';

export const FunctionGallery = () => {
  const toast = useToast();
  const [functions, setFunctions] = useState<GalleryFn[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [copyingId, setCopyingId] = useState<string | null>(null);
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/api/functions/gallery', { params: { search: debouncedSearch } })
      .then((r) => setFunctions(r.data))
      .catch(() => toast.error('Не удалось загрузить галерею'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCopy = async (fn: GalleryFn) => {
    setCopyingId(fn.id);
    try {
      await api.post(`/api/functions/${fn.id}/copy`);
      setCopiedIds((prev) => new Set(prev).add(fn.id));
      toast.success(`«${fn.name}» добавлена в «Мои функции»`);
    } catch {
      toast.error('Не удалось добавить функцию');
    } finally {
      setCopyingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Функции, опубликованные другими пользователями. Добавьте любую к себе — она появится в
            разделе «Мои функции» и станет доступна для редактирования и использования.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по названию, описанию или автору..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Загрузка галереи...
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
              : 'Когда пользователи опубликуют свои функции — они появятся здесь'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-400">
            {debouncedSearch
              ? `Найдено: ${functions.length}`
              : `Всего опубликовано: ${functions.length}`}
          </p>
          <div className="space-y-3">
            {functions.map((fn) => (
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
};
