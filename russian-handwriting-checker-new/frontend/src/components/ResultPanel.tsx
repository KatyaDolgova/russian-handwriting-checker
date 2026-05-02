import { useState, useEffect } from 'react';
import { Pencil, Eye, CheckCircle2, AlertTriangle, Loader2, Printer, User2, Copy, Check, FolderClosed } from 'lucide-react';
import api from '../api';

interface Folder { id: string; name: string; }

interface ResultPanelProps {
  result: any;
  originalText: string;
  filename: string;
  functionId: string;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    if (!text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handle}
      title="Копировать"
      className="cursor-pointer flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
}

function ScoreBadge({ score, label, max }: { score: string; label?: string | null; max: string }) {
  if (label) {
    const isPass = label.toLowerCase().includes('зачёт') && !label.toLowerCase().includes('незачёт');
    return (
      <div className={`inline-flex items-center px-4 py-2 rounded-2xl border font-bold text-lg ${isPass ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
        {label}
      </div>
    );
  }
  const s = parseFloat(score) || 0;
  const m = parseFloat(max) || 100;
  const pct = m > 0 ? s / m : 0;
  const color =
    pct >= 0.8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    pct >= 0.5 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                 'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border font-bold text-2xl ${color}`}>
      {s}
      <span className="text-sm font-normal opacity-60">/ {m}</span>
    </div>
  );
}

export default function ResultPanel({ result, originalText, filename, functionId }: ResultPanelProps) {
  const [editedCorrected, setEditedCorrected] = useState(result.corrected_text || '');
  const [editedScore, setEditedScore] = useState(String(result.score ?? 0));
  const [scoreMax, setScoreMax] = useState('5');
  const [editedComment, setEditedComment] = useState(result.comment || '');
  const [pupilName, setPupilName] = useState('');
  const [workDate, setWorkDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [folderId, setFolderId] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showCorrected, setShowCorrected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/folders/').then(r => setFolders(r.data)).catch(() => {});
  }, []);

  const errors: any[] = result.errors || [];
  const criteria: Record<string, any> | null = result.criteria || null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.post('/api/check/save', {
        filename,
        original_text: originalText,
        corrected_text: editedCorrected,
        errors,
        score: parseFloat(editedScore) || 0,
        score_max: parseFloat(scoreMax) || 100,
        comment: editedComment,
        function_id: functionId,
        pupil_name: pupilName || undefined,
        folder_id: folderId || undefined,
        work_date: new Date(workDate).toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const scoreDisplay = result.score_label ?? `${parseFloat(editedScore) || 0} / ${parseFloat(scoreMax) || 100}`;
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <title>Отчёт: ${pupilName || filename}</title>
  <style>
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 40px auto; color: #111; font-size: 14px; line-height: 1.6; }
    h1 { font-size: 20px; border-bottom: 2px solid #333; padding-bottom: 8px; }
    .meta { color: #555; font-size: 13px; margin-bottom: 20px; }
    .score { font-size: 32px; font-weight: bold; }
    .section { margin-bottom: 18px; }
    .section-title { font-weight: bold; font-size: 13px; text-transform: uppercase; letter-spacing: .5px; color: #444; margin-bottom: 6px; }
    .error-row { display: flex; gap: 12px; font-size: 13px; border-bottom: 1px solid #eee; padding: 4px 0; }
    .del { color: #dc2626; text-decoration: line-through; }
    .ins { color: #16a34a; }
    .criteria-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .criteria-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; font-size: 12px; }
    .criteria-key { font-weight: bold; color: #4f46e5; }
    .text-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 13px; white-space: pre-wrap; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Проверка работы</h1>
  <div class="meta">
    ${pupilName ? `<strong>Ученик:</strong> ${pupilName} &nbsp;|&nbsp;` : ''}
    <strong>Файл:</strong> ${filename} &nbsp;|&nbsp;
    <strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}
  </div>
  <div class="section">
    <div class="section-title">Оценка</div>
    <div class="score">${scoreDisplay}</div>
  </div>
  ${editedComment ? `<div class="section"><div class="section-title">Комментарий</div><div class="text-box">${editedComment}</div></div>` : ''}
  ${criteria ? `<div class="section"><div class="section-title">Критерии</div><div class="criteria-grid">${Object.entries(criteria).map(([k, v]: [string, any]) => `<div class="criteria-cell"><span class="criteria-key">${k}</span> — ${v.score !== undefined ? v.score : v.result}${v.max !== undefined ? '/' + v.max : ''}${v.comment ? ': ' + v.comment : ''}</div>`).join('')}</div></div>` : ''}
  ${errors.length > 0 ? `<div class="section"><div class="section-title">Найденные ошибки (${errors.length})</div>${errors.map((e: any) => `<div class="error-row"><span class="del">${e.original || ''}</span><span>→</span><span class="ins">${e.corrected || ''}</span><span style="color:#666">${e.comment || e.type || ''}</span></div>`).join('')}</div>` : ''}
  <div class="section"><div class="section-title">Исправленный текст</div><div class="text-box">${editedCorrected}</div></div>
</body>
</html>`;
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
    win?.print();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Результат проверки</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            title="Печать отчёта"
            className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            Печать
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isEditing ? 'bg-slate-800 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {isEditing ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {isEditing ? 'Просмотр' : 'Редактировать'}
          </button>
        </div>
      </div>

      {/* Pupil name */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <User2 className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Имя ученика (необязательно)"
              value={pupilName}
              onChange={(e) => setPupilName(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none cursor-text"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-400 shrink-0">Дата работы</span>
            <input
              type="datetime-local"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
          {folders.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <FolderClosed className="h-4 w-4 text-amber-500 shrink-0" />
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="cursor-pointer flex-1 bg-transparent text-sm text-slate-700 focus:outline-none pr-6"
              >
                <option value="">Без папки</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Score + Comment */}
      <div className="grid grid-cols-2 gap-4 px-5 py-3 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Оценка</p>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={editedScore}
                onChange={(e) => setEditedScore(e.target.value)}
                className="w-20 p-2 border border-slate-300 rounded-xl text-lg font-bold text-center focus:outline-none focus:border-indigo-400 cursor-text"
                placeholder="0"
              />
              <span className="text-slate-400 text-sm font-medium">из</span>
              <input
                type="text"
                inputMode="decimal"
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
                className="w-20 p-2 border border-slate-300 rounded-xl text-lg font-bold text-center focus:outline-none focus:border-indigo-400 cursor-text"
                placeholder="100"
              />
            </div>
          ) : (
            <ScoreBadge score={editedScore} label={result.score_label} max={scoreMax} />
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Комментарий</p>
          {isEditing ? (
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-indigo-400 cursor-text"
            />
          ) : (
            <p className="text-slate-600 text-sm leading-relaxed line-clamp-4">{editedComment || '—'}</p>
          )}
        </div>
      </div>

      {/* Criteria */}
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

      {/* Errors */}
      {errors.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
            Ошибки <span className="text-slate-500">({errors.length})</span>
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {errors.map((err: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1 items-center">
                  {err.original && <span className="text-red-500 line-through">{err.original}</span>}
                  {err.corrected && <span className="text-emerald-600 font-medium">→ {err.corrected}</span>}
                  {err.comment && <span className="text-slate-400 text-xs">{err.comment}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Text section */}
      <div className="px-5 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Текст</p>
          <div className="flex items-center gap-2">
            <CopyBtn text={showCorrected || isEditing ? editedCorrected : originalText} />
            {!isEditing && (
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setShowCorrected(false)}
                  className={`cursor-pointer text-xs px-2.5 py-1 rounded-md transition-colors ${
                    !showCorrected ? 'bg-white text-slate-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  С ошибками
                </button>
                <button
                  onClick={() => setShowCorrected(true)}
                  className={`cursor-pointer text-xs px-2.5 py-1 rounded-md transition-colors ${
                    showCorrected ? 'bg-white text-slate-700 shadow-sm font-medium' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Исправленный
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing || showCorrected ? (
          <textarea
            value={editedCorrected}
            onChange={(e) => setEditedCorrected(e.target.value)}
            className="cursor-text w-full h-48 p-3 border border-slate-300 rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-indigo-400"
            placeholder="Исправленный текст..."
          />
        ) : (
          <div
            className="text-sm text-slate-700 leading-relaxed max-h-48 overflow-y-auto bg-slate-50 rounded-xl p-4"
            dangerouslySetInnerHTML={{ __html: result.html_highlighted || editedCorrected }}
          />
        )}
      </div>

      {/* Save */}
      <div className="px-5 pb-5">
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`cursor-pointer w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:cursor-default ${
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
            <>Сохранить результат</>
          )}
        </button>
      </div>
    </div>
  );
}
