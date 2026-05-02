import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ChevronDown, ChevronUp, Lock, FileCode, AlertCircle } from 'lucide-react';
import api from '../api';
import { useToast } from './Toast';

interface Fn {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  is_default?: boolean;
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

export default function FunctionManager() {
  const [functions, setFunctions] = useState<Fn[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />Загрузка...
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Стандартные функции нельзя удалить. Создайте свои под конкретные задания.</p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 ml-4"
          >
            <Plus className="h-4 w-4" />
            Создать функцию
          </button>
        )}
      </div>

      {creating && (
        <FunctionForm
          initial={EMPTY}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      <div className="space-y-2">
        {functions.map((fn) => (
          <div key={fn.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {editingId === fn.id ? (
              <div className="p-4">
                <FunctionForm
                  initial={{ name: fn.name, description: fn.description, system_prompt: fn.system_prompt, user_template: fn.user_template }}
                  onSave={(data) => handleUpdate(fn.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpandedId(expandedId === fn.id ? null : fn.id)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-800 text-sm">{fn.name}</p>
                        {fn.is_default && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Lock className="h-2.5 w-2.5" />стандартная
                          </span>
                        )}
                      </div>
                      {fn.description && <p className="text-xs text-slate-400 mt-0.5">{fn.description}</p>}
                    </div>
                    {expandedId === fn.id
                      ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                    }
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditingId(fn.id)}
                      className="cursor-pointer p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(confirmDeleteId === fn.id ? null : fn.id)}
                      disabled={!!fn.is_default}
                      className={`cursor-pointer p-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${confirmDeleteId === fn.id ? 'text-red-500 bg-red-50' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                      title={fn.is_default ? 'Нельзя удалить стандартную функцию' : 'Удалить'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {confirmDeleteId === fn.id && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="text-sm text-red-700 flex-1">Удалить «{fn.name}»?</span>
                      <button onClick={() => setConfirmDeleteId(null)} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">Отмена</button>
                      <button onClick={() => handleDelete(fn.id)} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Удалить</button>
                    </div>
                  </div>
                )}

                {expandedId === fn.id && (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Системный промпт</p>
                      <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed">{fn.system_prompt}</pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Шаблон</p>
                      <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 font-mono">{fn.user_template}</pre>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
