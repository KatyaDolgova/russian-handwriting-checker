import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, User2, Loader2, Trash2, Pencil, X, CheckCircle2, Copy, Check } from 'lucide-react';
import api from '../api';

interface CheckRecord {
  id: string;
  filename: string;
  pupil_name?: string;
  score: number;
  score_max: number;
  comment: string;
  corrected_text: string;
  created_at: string;
}

interface EditForm {
  score: string;
  scoreMax: string;
  comment: string;
  corrected_text: string;
  pupil_name: string;
}

function ScoreCircle({ score, max = 100 }: { score: number; max?: number }) {
  const pct = max > 0 ? score / max : 0;
  const color =
    pct >= 0.8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    pct >= 0.5 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                 'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base shrink-0 ${color}`}>
      {score}
    </div>
  );
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    if (!text?.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Копировать текст"
      className="cursor-pointer flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function EditPanel({
  check,
  onSave,
  onCancel,
}: {
  check: CheckRecord;
  onSave: (id: string, form: EditForm) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    score: String(check.score),
    scoreMax: String(check.score_max ?? 100),
    comment: check.comment || '',
    corrected_text: check.corrected_text || '',
    pupil_name: check.pupil_name || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(check.id, form); } finally { setSaving(false); }
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
              placeholder="100"
              className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-400"
            />
          </div>
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
          rows={5}
          className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-indigo-400"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={onCancel}
          className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <X className="h-3.5 w-3.5" />Отмена
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-default"
        >
          {saving
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Сохраняем...</>
            : <>Сохранить</>
          }
        </button>
      </div>
    </div>
  );
}

export default function HistoryPanel() {
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/check/history')
      .then((res) => setChecks(res.data.map((c: any) => ({ ...c, score_max: c.score_max ?? 100 }))))
      .catch(() => setChecks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить эту запись из истории?')) return;
    try {
      await api.delete(`/api/check/${id}`);
      setChecks((prev) => prev.filter((c) => c.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      alert('Не удалось удалить запись');
    }
  };

  const handleSaveEdit = async (id: string, form: EditForm) => {
    const scoreNum = parseFloat(form.score) || 0;
    const maxNum = parseFloat(form.scoreMax) || 100;
    await api.put(`/api/check/${id}`, {
      score: scoreNum,
      score_max: maxNum,
      comment: form.comment,
      corrected_text: form.corrected_text,
      pupil_name: form.pupil_name || null,
    });
    setChecks((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, score: scoreNum, score_max: maxNum, comment: form.comment, corrected_text: form.corrected_text, pupil_name: form.pupil_name || undefined }
          : c
      )
    );
    setEditingId(null);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Загружаем историю...
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">История пуста</p>
        <p className="text-slate-400 text-sm mt-1">Проверьте работу и сохраните результат</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {checks.map((check) => (
        <div key={check.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center">
            <button
              onClick={() => {
                setExpandedId(expandedId === check.id ? null : check.id);
                setEditingId(null);
              }}
              className="cursor-pointer flex-1 flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
            >
              <ScoreCircle score={check.score} max={check.score_max} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {check.pupil_name && (
                    <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      <User2 className="h-3 w-3" />{check.pupil_name}
                    </span>
                  )}
                  {savedId === check.id && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />Сохранено
                    </span>
                  )}
                  <span className="text-xs text-slate-400 truncate">{check.filename}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1">{check.comment || '—'}</p>
                <p className="text-xs text-slate-300 mt-1">{formatDate(check.created_at)}</p>
              </div>

              {expandedId === check.id
                ? <ChevronUp className="h-4 w-4 text-slate-300 shrink-0" />
                : <ChevronDown className="h-4 w-4 text-slate-300 shrink-0" />
              }
            </button>

            <div className="flex items-center gap-1 mr-3 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedId(check.id);
                  setEditingId(editingId === check.id ? null : check.id);
                }}
                title="Редактировать"
                className={`cursor-pointer p-2 rounded-lg transition-colors ${
                  editingId === check.id
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => handleDelete(check.id, e)}
                title="Удалить"
                className="cursor-pointer p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {expandedId === check.id && (
            editingId === check.id ? (
              <EditPanel
                check={check}
                onSave={handleSaveEdit}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="border-t border-slate-100 px-4 py-4 space-y-3">
                {check.comment && (
                  <p className="text-sm text-slate-600 leading-relaxed">{check.comment}</p>
                )}
                {check.corrected_text && (
                  <div>
                    <div className="flex justify-end mb-1">
                      <CopyBtn text={check.corrected_text} />
                    </div>
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                      {check.corrected_text}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      ))}
    </div>
  );
}
