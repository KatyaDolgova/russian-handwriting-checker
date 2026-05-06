import { useState } from 'react';
import { useToast } from '@/components/ui/ui/Toast';
import { FileCode, X, Loader2 } from 'lucide-react';
import type { Fn } from '@/types';

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

export const FunctionForm = ({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Fn, 'id'>;
  onSave: (data: Omit<Fn, 'id'>) => Promise<void>;
  onCancel: () => void;
}) => {
  const toast = useToast();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);

  const field = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.system_prompt!.trim()) {
      toast.info('Заполните название и системный промпт');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-indigo-200 bg-indigo-50/40 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Название *</label>
          <input
            {...field('name')}
            placeholder="Проверка диктанта"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Описание</label>
          <input
            {...field('description')}
            placeholder="Краткое описание"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-medium text-slate-600">
            Системный промпт * (инструкции для ИИ)
          </label>
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
              (необязательно — используй{' '}
              <code className="bg-slate-100 px-1 rounded">{'{text}'}</code> для подстановки текста;
              оставь пустым, если текст не нужен)
            </span>
          </label>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, user_template: 'Проверь следующий текст:\n\n{text}' }))
            }
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
        <button
          onClick={onCancel}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Отмена
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
};
