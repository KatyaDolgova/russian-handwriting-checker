import { useEffect, useState, useCallback } from 'react';
import {
  Plus, Pencil, Trash2, X, Loader2, ChevronDown, ChevronUp,
  Lock, FileCode, AlertCircle, Globe, EyeOff, Copy, History,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface Fn {
  id: string;
  user_id?: string | null;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  is_default?: boolean;
  is_published?: boolean;
  original_function_id?: string | null;
}

interface FnVersion {
  id: string;
  version_number: number;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  change_note: string | null;
  created_at: string;
}

function formatVersionDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const EMPTY: Omit<Fn, 'id'> = {
  name: '',
  description: '',
  system_prompt: '',
  user_template: '',
};

const PROMPT_TEMPLATE = `Ты — опытный учитель русского языка. [Опиши своё задание здесь]

Верни ответ СТРОГО в формате JSON (без лишнего текста вокруг):
{
  "corrected": "<исправленный текст ученика>",
  "errors": [
    {
      "original": "<слово или фраза с ошибкой>",
      "corrected": "<исправленный вариант>",
      "type": "<орфография|пунктуация|грамматика|стиль>",
      "comment": "<краткое пояснение>"
    }
  ],
  "score": <число от 0 до 5, где 5 — отлично>,
  "comment": "<общий комментарий учителя>"
}`;

// ── Форма создания / редактирования ──────────────────────────────────────────

function FunctionForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Fn, 'id'>;
  onSave: (data: Omit<Fn, 'id'>) => Promise<void>;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.system_prompt.trim()) {
      toast.info('Заполните название и системный промпт');
      return;
    }
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Название *</label>
          <input {...field('name')} placeholder="Проверка диктанта" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Описание</label>
          <input {...field('description')} placeholder="Краткое описание" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-600">Системный промпт * (инструкции для ИИ)</label>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, system_prompt: PROMPT_TEMPLATE }))}
            className="cursor-pointer flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
          >
            <FileCode className="h-3 w-3" />
            Вставить шаблон
          </button>
        </div>
        <textarea
          {...field('system_prompt')}
          rows={8}
          placeholder="Ты — опытный учитель русского языка. Проверь текст и верни результат в формате JSON..."
          className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono resize-y focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-600">
            Шаблон запроса{' '}
            <span className="text-slate-400 font-normal">
              (необязательно — используй <code className="bg-slate-100 px-1 rounded">{'{text}'}</code> для подстановки текста; оставь пустым, если текст не нужен)
            </span>
          </label>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, user_template: 'Проверь следующий текст:\n\n{text}' }))}
            className="cursor-pointer flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors shrink-0 ml-2"
          >
            <FileCode className="h-3 w-3" />
            Вставить шаблон
          </button>
        </div>
        <textarea
          {...field('user_template')}
          rows={2}
          placeholder={'Проверь следующий текст:\n\n{text}'}
          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono resize-y focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <X className="h-3.5 w-3.5" />Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-default"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Сохранить
        </button>
      </div>
    </div>
  );
}

// ── Строка версии ─────────────────────────────────────────────────────────────

function VersionRow({ ver, isLatest }: { ver: FnVersion; isLatest: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
      >
        <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
          isLatest
            ? 'bg-indigo-600 text-white'
            : 'bg-slate-100 text-slate-500'
        }`}>
          v{ver.version_number}
        </span>
        <span className="text-xs text-slate-400 shrink-0">{formatVersionDate(ver.created_at)}</span>
        {ver.change_note
          ? <span className="text-xs text-slate-600 flex-1 truncate">{ver.change_note}</span>
          : <span className="text-xs text-slate-300 flex-1 italic">без заметки</span>
        }
        {isLatest && (
          <span className="shrink-0 text-xs text-indigo-500">текущая</span>
        )}
        {open
          ? <ChevronUp className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          : <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        }
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 bg-slate-50">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1 mt-2">Системный промпт</p>
            <pre className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100 overflow-auto max-h-36 whitespace-pre-wrap font-mono leading-relaxed">
              {ver.system_prompt}
            </pre>
          </div>
          {ver.user_template && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Шаблон</p>
              <pre className="text-xs text-slate-600 bg-white rounded-lg p-2 border border-slate-100 font-mono">
                {ver.user_template}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Карточка функции ──────────────────────────────────────────────────────────

function FunctionCard({
  fn,
  isExpanded,
  isEditing,
  isOwn,
  confirmDeleteId,
  confirmUnpublishId,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onTogglePublish,
  onConfirmUnpublish,
  onCancelUnpublish,
}: {
  fn: Fn;
  isExpanded: boolean;
  isEditing: boolean;
  isOwn: boolean;
  confirmDeleteId: string | null;
  confirmUnpublishId: string | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (data: Omit<Fn, 'id'>) => Promise<void>;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onTogglePublish: () => void;
  onConfirmUnpublish: () => void;
  onCancelUnpublish: () => void;
}) {
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<FnVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const loadVersions = useCallback(async () => {
    if (versions.length > 0) return;
    setVersionsLoading(true);
    try {
      const r = await api.get(`/api/functions/${fn.id}/versions`);
      setVersions(r.data);
    } finally {
      setVersionsLoading(false);
    }
  }, [fn.id, versions.length]);

  const handleToggleVersions = () => {
    if (!showVersions) loadVersions();
    setShowVersions(v => !v);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {isEditing ? (
        <div className="p-4">
          <FunctionForm
            initial={{ name: fn.name, description: fn.description, system_prompt: fn.system_prompt, user_template: fn.user_template }}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </div>
      ) : (
        <>
          {/* Заголовок карточки */}
          <div className="flex items-center gap-3 px-4 py-3">
            <button onClick={onToggleExpand} className="flex-1 flex items-center gap-3 text-left min-w-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 text-sm">{fn.name}</p>
                  {fn.is_default && (
                    <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      <Lock className="h-2.5 w-2.5" />стандартная
                    </span>
                  )}
                  {isOwn && fn.is_published && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      <Globe className="h-2.5 w-2.5" />опубликована
                    </span>
                  )}
                  {isOwn && !fn.is_published && !fn.is_default && (
                    <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                      черновик
                    </span>
                  )}
                  {fn.original_function_id && (
                    <span className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                      <Copy className="h-2.5 w-2.5" />скопировано
                    </span>
                  )}
                </div>
                {fn.description && <p className="text-xs text-slate-400 mt-0.5 truncate">{fn.description}</p>}
              </div>
              {isExpanded
                ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              }
            </button>

            {/* Кнопки действий (только для своих) */}
            {isOwn && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onEdit}
                  className="cursor-pointer p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={fn.is_published ? onTogglePublish : onTogglePublish}
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    fn.is_published
                      ? 'text-emerald-600 hover:bg-red-50 hover:text-red-500'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={fn.is_published ? 'Снять с публикации' : 'Опубликовать в галерею'}
                >
                  {fn.is_published ? <EyeOff className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={onConfirmDelete}
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    confirmDeleteId === fn.id ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Подтверждение снятия с публикации */}
          {confirmUnpublishId === fn.id && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm text-amber-700 flex-1">Снять «{fn.name}» с публикации? Функция пропадёт из галереи.</span>
                <button onClick={onCancelUnpublish} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">Отмена</button>
                <button onClick={onConfirmUnpublish} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors">Снять</button>
              </div>
            </div>
          )}

          {/* Подтверждение удаления */}
          {confirmDeleteId === fn.id && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700 flex-1">Удалить «{fn.name}»?</span>
                <button onClick={onCancelDelete} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">Отмена</button>
                <button onClick={onDelete} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Удалить</button>
              </div>
            </div>
          )}

          {/* Раскрытое содержимое */}
          {isExpanded && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Системный промпт</p>
                <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed">{fn.system_prompt}</pre>
              </div>
              {fn.user_template ? (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Шаблон</p>
                  <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 font-mono">{fn.user_template}</pre>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Шаблон не задан — функция принимает произвольный текст</p>
              )}

              {/* История версий — только для своих опубликованных */}
              {isOwn && fn.is_published && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleToggleVersions}
                    className="cursor-pointer flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors py-1"
                  >
                    {versionsLoading
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <History className="h-3.5 w-3.5" />
                    }
                    {showVersions ? 'Скрыть историю версий' : 'История версий'}
                    {!showVersions && versions.length > 0 && (
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{versions.length}</span>
                    )}
                  </button>

                  {showVersions && (
                    <div className="mt-2 space-y-1.5">
                      {versions.length === 0 && !versionsLoading && (
                        <p className="text-xs text-slate-400 italic pl-1">Версии не найдены</p>
                      )}
                      {versions.map((ver, idx) => (
                        <VersionRow
                          key={ver.id}
                          ver={ver}
                          isLatest={idx === 0}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Заголовок секции ──────────────────────────────────────────────────────────

function SectionHeader({ title, count, children }: { title: string; count: number; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{title}</h3>
        <span className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{count}</span>
      </div>
      {children}
    </div>
  );
}

// ── Главный компонент ─────────────────────────────────────────────────────────

export default function FunctionManager() {
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
    api.get('/api/functions/').then((r) => setFunctions(r.data)).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

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
      const fn = functions.find(f => f.id === id);
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

  const defaultFns = functions.filter(f => f.is_default);
  const myFns = functions.filter(f => !f.is_default && f.user_id === user?.user_id);

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />Загрузка...
    </div>
  );

  return (
    <div className="space-y-8">

      {/* ── Мои функции ── */}
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
            <Loader2 className="h-3 w-3 animate-spin" />Обновляем публикацию...
          </div>
        )}
      </div>

      {/* ── Стандартные функции ── */}
      <div>
        <SectionHeader title="Стандартные функции" count={defaultFns.length} />
        <p className="text-xs text-slate-400 mb-3">Встроенные шаблоны — доступны всем пользователям, нельзя изменить или удалить.</p>
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
}
