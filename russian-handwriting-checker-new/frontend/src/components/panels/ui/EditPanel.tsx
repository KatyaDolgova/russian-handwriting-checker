import type { CheckRecord, EditForm, Folder } from '@/types';
import { toLocalDatetime } from '@/utils';
import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface EditPanelProps {
  check: CheckRecord;
  folders: Folder[];
  onSave: (id: string, form: EditForm) => Promise<void>;
  onCancel: () => void;
}

export const EditPanel = ({ check, folders, onSave, onCancel }: EditPanelProps) => {
  const [form, setForm] = useState<EditForm>(() => ({
    score: String(check.score),
    scoreMax: String(check.score_max ?? 5),
    comment: check.comment || '',
    corrected_text: check.corrected_text || '',
    pupil_name: check.pupil_name || '',
    workDate: toLocalDatetime(check.work_date || check.created_at),
    folder_id: check.folder_id || '',
  }));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(check.id, form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-slate-100 px-4 py-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Ученик</label>
          <input
            value={form.pupil_name}
            onChange={(e) => setForm((f) => ({ ...f, pupil_name: e.target.value }))}
            placeholder="Имя ученика"
            className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Оценка</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="decimal"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              placeholder="0"
              className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-400"
            />
            <span className="text-slate-400 text-sm shrink-0">из</span>
            <input
              type="text"
              inputMode="decimal"
              value={form.scoreMax}
              onChange={(e) => setForm((f) => ({ ...f, scoreMax: e.target.value }))}
              placeholder="5"
              className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Дата работы</label>
          <input
            type="datetime-local"
            value={form.workDate}
            onChange={(e) => setForm((f) => ({ ...f, workDate: e.target.value }))}
            className="cursor-pointer w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Папка</label>
          <select
            value={form.folder_id}
            onChange={(e) => setForm((f) => ({ ...f, folder_id: e.target.value }))}
            className="cursor-pointer w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white"
          >
            <option value="">Без папки</option>
            {folders.map((fl) => (
              <option key={fl.id} value={fl.id}>
                {fl.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Комментарий</label>
        <textarea
          value={form.comment}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          rows={3}
          className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Исправленный текст</label>
        <textarea
          value={form.corrected_text}
          onChange={(e) => setForm((f) => ({ ...f, corrected_text: e.target.value }))}
          rows={4}
          className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="h-3.5 w-3.5" />
          Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-default"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Сохраняем...
            </>
          ) : (
            <>Сохранить</>
          )}
        </button>
      </div>
    </div>
  );
};
