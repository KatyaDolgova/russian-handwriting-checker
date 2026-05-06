import { useEffect, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from './Toast';
import type { Fn } from '@/types';
import { FunctionForm, SectionHeader } from '@/components/ui';
import { FunctionCard } from '@/components/cards';

const EMPTY: Omit<Fn, 'id'> = {
  name: '',
  description: '',
  system_prompt: '',
  user_template: '',
};

export const FunctionManager = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [functions, setFunctions] = useState<Fn[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmUnpublishId, setConfirmUnpublishId] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const load = () =>
    api
      .get('/api/functions/')
      .then((r) => setFunctions(r.data))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (data: Omit<Fn, 'id'>) => {
    await api.post('/api/functions/', data);
    setCreating(false);
    load();
  };

  const handleUpdate = async (id: string, data: Omit<Fn, 'id'>) => {
    await api.put(`/api/functions/${id}`, data);
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/api/functions/${id}`);
    setConfirmDeleteId(null);
    load();
  };

  const handlePublishToggle = async (fn: Fn) => {
    if (fn.is_published) {
      setConfirmUnpublishId(fn.id);
      return;
    }
    await doPublish(fn.id);
  };

  const doPublish = async (id: string) => {
    setPublishingId(id);
    try {
      await api.post(`/api/functions/${id}/publish`);
      const fn = functions.find((f) => f.id === id);
      if (fn && !fn.is_published) {
        toast.success('Функция опубликована в галерею');
      }
      load();
    } catch {
      toast.error('Ошибка при публикации');
    } finally {
      setPublishingId(null);
      setConfirmUnpublishId(null);
    }
  };

  const defaultFns = functions.filter((f) => f.is_default);
  const myFns = functions.filter((f) => !f.is_default && f.user_id === user?.user_id);

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Загрузка...
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="Мои функции" count={myFns.length}>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="cursor-pointer flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Создать
            </button>
          )}
        </SectionHeader>

        <div className="space-y-2">
          {creating && (
            <FunctionForm
              initial={EMPTY}
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
            />
          )}

          {myFns.length === 0 && !creating && (
            <div className="text-center py-8 text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Нет созданных функций. Нажмите «Создать», чтобы добавить свою.
            </div>
          )}

          {myFns.map((fn) => (
            <FunctionCard
              key={fn.id}
              fn={fn}
              isExpanded={expandedId === fn.id}
              isEditing={editingId === fn.id}
              isOwn
              confirmDeleteId={confirmDeleteId}
              confirmUnpublishId={confirmUnpublishId}
              onToggleExpand={() => setExpandedId(expandedId === fn.id ? null : fn.id)}
              onEdit={() => setEditingId(fn.id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={(data) => handleUpdate(fn.id, data)}
              onDelete={() => handleDelete(fn.id)}
              onConfirmDelete={() => setConfirmDeleteId(confirmDeleteId === fn.id ? null : fn.id)}
              onCancelDelete={() => setConfirmDeleteId(null)}
              onTogglePublish={() => handlePublishToggle(fn)}
              onConfirmUnpublish={() => doPublish(fn.id)}
              onCancelUnpublish={() => setConfirmUnpublishId(null)}
            />
          ))}
        </div>

        {publishingId && (
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Обновляем публикацию...
          </div>
        )}
      </div>

      <div>
        <SectionHeader title="Стандартные функции" count={defaultFns.length} />
        <p className="text-xs text-slate-400 mb-3">
          Встроенные шаблоны — доступны всем пользователям, нельзя изменить или удалить.
        </p>
        <div className="space-y-2">
          {defaultFns.map((fn) => (
            <FunctionCard
              key={fn.id}
              fn={fn}
              isExpanded={expandedId === fn.id}
              isEditing={false}
              isOwn={false}
              confirmDeleteId={null}
              confirmUnpublishId={null}
              onToggleExpand={() => setExpandedId(expandedId === fn.id ? null : fn.id)}
              onEdit={() => {}}
              onCancelEdit={() => {}}
              onSaveEdit={async () => {}}
              onDelete={() => {}}
              onConfirmDelete={() => {}}
              onCancelDelete={() => {}}
              onTogglePublish={() => {}}
              onConfirmUnpublish={() => {}}
              onCancelUnpublish={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
