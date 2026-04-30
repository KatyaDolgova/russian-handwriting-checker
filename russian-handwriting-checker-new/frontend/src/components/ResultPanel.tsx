import { useState } from 'react';
import { Save, Pencil, Eye, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import api from '../api';

interface ResultPanelProps {
  result: any;
  originalText: string;
  filename: string;
  functionId: string;
}

function ScoreBadge({ score, label }: { score: number; label?: string | null }) {
  if (label) {
    const isPass = label.toLowerCase().includes('зачёт');
    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-2xl border font-bold text-lg ${isPass ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
        {label}
      </div>
    );
  }
  const color =
    score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                  'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-2xl ${color}`}>
      {score}
      <span className="text-sm font-normal opacity-60">/ 100</span>
    </div>
  );
}

export default function ResultPanel({ result, originalText, filename, functionId }: ResultPanelProps) {
  const [editedCorrected, setEditedCorrected] = useState(result.corrected_text || '');
  const [editedScore, setEditedScore] = useState(result.score ?? 0);
  const [editedComment, setEditedComment] = useState(result.comment || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const errors: any[] = result.errors || [];
  const criteria: Record<string, any> | null = result.criteria || null;

  const handleSave = async () => {
    const pupilName = prompt('Имя ученика (необязательно):') || undefined;
    setSaving(true);
    setSaved(false);
    try {
      await api.post('/api/check/save', {
        filename,
        original_text: originalText,
        corrected_text: editedCorrected,
        errors,
        score: editedScore,
        comment: editedComment,
        function_id: functionId,
        pupil_name: pupilName,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Результат проверки</h2>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
            isEditing
              ? 'bg-slate-800 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
          }`}
        >
          {isEditing ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
          {isEditing ? 'Просмотр' : 'Редактировать'}
        </button>
      </div>

      {/* Score + Comment */}
      <div className="grid grid-cols-2 gap-4 p-5 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Оценка</p>
          {isEditing ? (
            <input
              type="number"
              value={editedScore}
              onChange={(e) => setEditedScore(parseFloat(e.target.value))}
              className="w-24 p-2 border border-slate-300 rounded-xl text-xl font-bold text-center focus:outline-none focus:border-indigo-400"
              min="0" max="100"
            />
          ) : (
            <ScoreBadge score={editedScore} label={result.score_label} />
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Комментарий</p>
          {isEditing ? (
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-indigo-400"
            />
          ) : (
            <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">{editedComment || '—'}</p>
          )}
        </div>
      </div>

      {/* Criteria (OGE/EGE) */}
      {criteria && (
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Критерии</p>
          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
            {Object.entries(criteria).map(([key, val]: [string, any]) => (
              <div key={key} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5 text-xs">
                <span className="font-semibold text-slate-600 w-8 shrink-0">{key}</span>
                <span className="text-indigo-600 font-bold shrink-0">
                  {val.score !== undefined ? val.score : val.result}
                </span>
                {val.max !== undefined && <span className="text-slate-300">/{val.max}</span>}
                {val.comment && <span className="text-slate-400 truncate">{val.comment}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors list */}
      {errors.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
            Ошибки <span className="text-slate-500">({errors.length})</span>
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {errors.map((err: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  {err.original && (
                    <span className="text-red-500 line-through mr-2">{err.original}</span>
                  )}
                  {err.corrected && (
                    <span className="text-emerald-600 font-medium mr-2">{err.corrected}</span>
                  )}
                  {err.comment && (
                    <span className="text-slate-500">{err.comment}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corrected text */}
      <div className="px-5 py-4 flex-1">
        <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Исправленный текст</p>
        {isEditing ? (
          <textarea
            value={editedCorrected}
            onChange={(e) => setEditedCorrected(e.target.value)}
            className="w-full h-48 p-3 border border-slate-300 rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-indigo-400"
          />
        ) : (
          <div
            className="text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-4"
            dangerouslySetInnerHTML={{ __html: result.html_highlighted || editedCorrected }}
          />
        )}
      </div>

      {/* Save button */}
      <div className="px-5 pb-5">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all ${
            saved
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white'
          }`}
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Сохраняем...</>
          ) : saved ? (
            <><CheckCircle2 className="h-4 w-4" />Сохранено!</>
          ) : (
            <><Save className="h-4 w-4" />Сохранить результат</>
          )}
        </button>
      </div>
    </div>
  );
}
