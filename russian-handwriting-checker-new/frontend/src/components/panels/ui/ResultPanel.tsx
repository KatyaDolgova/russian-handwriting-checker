import { useState, useEffect, useRef } from 'react';
import {
  Pencil,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Printer,
  User2,
  FolderClosed,
  Download,
  ChevronDown,
} from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ui/Toast';
import { CopyBtn, ScoreBadge } from '@/components/ui';
import type { Folder, Student } from '@/types';
import { PASS, FAIL, COMMENT_PREVIEW_LENGTH, SAVE_FEEDBACK_DURATION_MS } from '@/constants';

const CommentBlock = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <p className="text-slate-400 text-sm">-</p>;
  const isLong = text.length > COMMENT_PREVIEW_LENGTH;
  return (
    <div>
      <p className="text-slate-600 text-sm leading-relaxed">
        {isLong && !expanded ? text.slice(0, COMMENT_PREVIEW_LENGTH) + '…' : text}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="cursor-pointer text-xs text-indigo-500 hover:text-indigo-700 mt-1 transition-colors"
        >
          {expanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      )}
    </div>
  );
};

interface ResultPanelProps {
  result: any;
  originalText: string;
  sourceText?: string;
  filename: string;
  functionId: string;
}

export const ResultPanel = ({
  result,
  originalText,
  sourceText = '',
  filename,
  functionId,
}: ResultPanelProps) => {
  const { user } = useAuth();
  const toast = useToast();
  const [editedCorrected, setEditedCorrected] = useState(result.corrected_text || '');
  const [editedScore, setEditedScore] = useState(() => {
    if (result.is_generation) return '';
    // Зачёт/незачёт
    if (typeof result.score === 'string') return result.score.toLowerCase();
    // Критерии только с result (зачёт/незачёт) без числовых баллов
    const crit = result.criteria as Record<string, any> | null | undefined;
    if (
      crit &&
      Object.values(crit).every((v: any) => v.result !== undefined && v.score === undefined)
    ) {
      return (Object.values(crit) as any[]).every((v) => v.result === PASS) ? PASS : FAIL;
    }
    if (result.score == null) return '';
    // Числовые критерии - считаем сумму
    if (crit) {
      const vals = Object.values(crit);
      const hasNumeric = vals.some((v: any) => typeof v.score === 'number');
      if (hasNumeric) {
        const total = vals.reduce(
          (sum: number, v: any) => sum + (typeof v.score === 'number' ? v.score : 0),
          0,
        );
        return String(total);
      }
    }
    return String(result.score);
  });
  const [scoreMax, setScoreMax] = useState(() => {
    const crit = result.criteria as Record<string, any> | null | undefined;
    if (crit) {
      const total = Object.values(crit).reduce((sum: number, v: any) => {
        return sum + (v.max != null ? Number(v.max) : 0);
      }, 0);
      if (total > 0) return String(total);
    }
    if (result.score_max != null) return String(result.score_max);
    return '5';
  });
  const [editedComment, setEditedComment] = useState(result.comment || '');
  const [title, setTitle] = useState('');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [showStudentDrop, setShowStudentDrop] = useState(false);
  const [workDate, setWorkDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [folderId, setFolderId] = useState('');
  const [folderName, setFolderName] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderDrop, setShowFolderDrop] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showCorrected, setShowCorrected] = useState(false);
  const rawLabel = result.score_label;
  const [scoreLabel, setScoreLabel] = useState<string | null>(
    rawLabel && rawLabel.toLowerCase() !== 'none' ? rawLabel : null,
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDownloadMenu) return;
    const handler = (e: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowDownloadMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDownloadMenu]);

  useEffect(() => {
    api
      .get('/api/folders/')
      .then((r) => setFolders(Array.isArray(r.data) ? r.data : []))
      .catch(() => {});
    if (user) {
      api
        .get('/api/students/')
        .then((r) => setStudents(Array.isArray(r.data) ? r.data : []))
        .catch(() => {});
    }
  }, [user]);

  const isGeneration: boolean = !!result.is_generation;

  const errors: any[] = result.errors || [];
  const criteria: Record<string, any> | null = result.criteria || null;
  const passFail: string | null =
    typeof result.score === 'string' && [PASS, FAIL].includes(result.score.toLowerCase())
      ? result.score.toLowerCase()
      : criteria &&
          Object.values(criteria).every((v: any) => v.result !== undefined && v.score === undefined)
        ? (Object.values(criteria) as any[]).every((v) => v.result === PASS)
          ? PASS
          : FAIL
        : null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      let resolvedStudentId = studentId;

      if (!resolvedStudentId && studentName.trim()) {
        const res = await api.post('/api/students/', { name: studentName.trim() });
        resolvedStudentId = res.data.id;
        setStudents((prev) =>
          prev.find((s) => s.id === res.data.id) ? prev : [...prev, res.data],
        );
        setStudentId(res.data.id);
      }

      let resolvedFolderId = folderId;
      if (!resolvedFolderId && folderName.trim()) {
        const res = await api.post('/api/folders/', { name: folderName.trim() });
        resolvedFolderId = res.data.id;
        setFolders((prev) => (prev.find((f) => f.id === res.data.id) ? prev : [...prev, res.data]));
        setFolderId(res.data.id);
      }

      const isPassFailResult = passFail != null;
      const hasScore = !isPassFailResult && editedScore.trim() !== '';
      await api.post('/api/check/save', {
        filename,
        title: title.trim() || undefined,
        source_text: sourceText || undefined,
        original_text: originalText,
        corrected_text: editedCorrected,
        errors,
        criteria: criteria || undefined,
        pass_fail: isPassFailResult ? editedScore : undefined,
        score: hasScore ? parseFloat(editedScore) : null,
        score_max: hasScore ? parseFloat(scoreMax) || 5 : null,
        comment: editedComment,
        function_id: functionId,
        student_id: resolvedStudentId || undefined,
        folder_id: resolvedFolderId || undefined,
        work_date: new Date(workDate).toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), SAVE_FEEDBACK_DURATION_MS);
    } catch {
      toast.error('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const buildHtml = () => {
    const scoreDisplay =
      result.score_label ?? `${parseFloat(editedScore) || 0} / ${parseFloat(scoreMax) || 5}`;
    return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <title>Отчёт: ${title || studentName || filename}</title>
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
  <h1>${title || 'Проверка работы'}</h1>
  <div class="meta">
    ${studentName ? `<strong>Ученик:</strong> ${studentName} &nbsp;|&nbsp;` : ''}
    <strong>Файл:</strong> ${filename} &nbsp;|&nbsp;
    <strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}
  </div>
  <div class="section">
    <div class="section-title">Оценка</div>
    <div class="score">${scoreDisplay}</div>
  </div>
  ${editedComment ? `<div class="section"><div class="section-title">Комментарий</div><div class="text-box">${editedComment}</div></div>` : ''}
  ${
    criteria
      ? `<div class="section"><div class="section-title">Критерии</div><div class="criteria-grid">${Object.entries(
          criteria,
        )
          .map(
            ([k, v]: [string, any]) =>
              `<div class="criteria-cell"><span class="criteria-key">${k}</span> - ${v.score !== undefined ? v.score : v.result}${v.max !== undefined ? '/' + v.max : ''}${v.comment ? ': ' + v.comment : ''}</div>`,
          )
          .join('')}</div></div>`
      : ''
  }
  ${sourceText ? `<div class="section"><div class="section-title">Исходный текст</div><div class="text-box">${sourceText}</div></div>` : ''}
  ${errors.length > 0 ? `<div class="section"><div class="section-title">Найденные ошибки (${errors.length})</div>${errors.map((e: any) => `<div class="error-row"><span class="del">${e.original || ''}</span><span>→</span><span class="ins">${e.corrected || ''}</span><span style="color:#666">${e.comment || e.type || ''}</span></div>`).join('')}</div>` : ''}
  <div class="section"><div class="section-title">Исправленный текст</div><div class="text-box">${editedCorrected}</div></div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = buildHtml();
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([buildHtml()], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || studentName || filename || 'отчёт'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  const handleDownloadTxt = () => {
    const scoreDisplay =
      result.score_label ?? `${parseFloat(editedScore) || 0} / ${parseFloat(scoreMax) || 5}`;
    const lines: string[] = [];
    lines.push(title || 'Проверка работы');
    lines.push('='.repeat(40));
    if (studentName) lines.push(`Ученик: ${studentName}`);
    lines.push(`Файл: ${filename}`);
    lines.push(`Дата: ${new Date().toLocaleDateString('ru-RU')}`);
    lines.push('');
    lines.push(`Оценка: ${scoreDisplay}`);
    if (editedComment) { lines.push(''); lines.push('Комментарий:'); lines.push(editedComment); }
    if (criteria) {
      lines.push(''); lines.push('Критерии:');
      Object.entries(criteria).forEach(([k, v]: [string, any]) => {
        const score = v.score !== undefined ? v.score : v.result;
        const max = v.max !== undefined ? `/${v.max}` : '';
        lines.push(`  ${k}: ${score}${max}${v.comment ? ' — ' + v.comment : ''}`);
      });
    }
    if (sourceText) { lines.push(''); lines.push('Исходный текст:'); lines.push(sourceText); }
    if (errors.length > 0) {
      lines.push(''); lines.push(`Ошибки (${errors.length}):`);
      errors.forEach((e: any) => {
        lines.push(`  ${e.original || ''} → ${e.corrected || ''} (${e.comment || e.type || ''})`);
      });
    }
    lines.push(''); lines.push('Исправленный текст:'); lines.push(editedCorrected);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || studentName || filename || 'отчёт'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowDownloadMenu(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Результат проверки
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative" ref={downloadMenuRef}>
            <div className="flex rounded-lg overflow-hidden border border-slate-200">
              <button
                onClick={handlePrint}
                title="Печать отчёта"
                className="cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                <Printer className="h-3.5 w-3.5" />
                Печать
              </button>
              <button
                onClick={() => setShowDownloadMenu((v) => !v)}
                title="Скачать отчёт"
                className="cursor-pointer flex items-center px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors border-l border-slate-200"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
            {showDownloadMenu && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[160px]">
                <button
                  onClick={handleDownloadHtml}
                  className="cursor-pointer w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-indigo-500" />
                  Скачать HTML
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="cursor-pointer w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="h-3.5 w-3.5 text-slate-400" />
                  Скачать TXT
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`cursor-pointer flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isEditing
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            {isEditing ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {isEditing ? 'Просмотр' : 'Редактировать'}
          </button>
        </div>
      </div>

      <div className="px-5 pt-4 pb-2">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-400 shrink-0">Название</span>
            <input
              type="text"
              placeholder="Диктант №3, Сочинение..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none cursor-text"
            />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <User2 className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoComplete="off"
                placeholder="Имя ученика (необязательно)"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  setStudentId('');
                }}
                onFocus={() => setShowStudentDrop(true)}
                onBlur={() => setTimeout(() => setShowStudentDrop(false), 150)}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none cursor-text"
              />
            </div>
            {showStudentDrop && students.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {students
                  .filter(
                    (s) =>
                      !studentName.trim() ||
                      s.name.toLowerCase().includes(studentName.toLowerCase()),
                  )
                  .map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => {
                        setStudentId(s.id);
                        setStudentName(s.name);
                        setShowStudentDrop(false);
                      }}
                      className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <User2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {s.name}
                    </button>
                  ))}
              </div>
            )}
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

          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
              <FolderClosed className="h-4 w-4 text-amber-500 shrink-0" />
              <input
                type="text"
                autoComplete="off"
                placeholder="Папка (необязательно)"
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  setFolderId('');
                }}
                onFocus={() => setShowFolderDrop(true)}
                onBlur={() => setTimeout(() => setShowFolderDrop(false), 150)}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none cursor-text"
              />
            </div>
            {showFolderDrop && folders.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                {folders
                  .filter(
                    (f) =>
                      !folderName.trim() || f.name.toLowerCase().includes(folderName.toLowerCase()),
                  )
                  .map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onMouseDown={() => {
                        setFolderId(f.id);
                        setFolderName(f.name);
                        setShowFolderDrop(false);
                      }}
                      className="cursor-pointer w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2 first:rounded-t-xl last:rounded-b-xl"
                    >
                      <FolderClosed className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      {f.name}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {(() => {
        const minWords: number | null = result.min_words ?? null;
        if (!minWords) return null;
        const wordCount = originalText.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount >= minWords) return null;
        return (
          <div className="mx-5 mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Текст слишком короткий ({wordCount} сл. из минимум {minWords}). Результат проверки
              может быть неточным - работа не соответствует требованиям к объёму.
            </span>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 py-3 border-b border-slate-100">
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Оценка</p>
          {passFail != null ? (
            <select
              value={editedScore}
              onChange={(e) => setEditedScore(e.target.value)}
              className={`cursor-pointer w-full px-3 py-2 border-2 rounded-xl text-sm font-bold focus:outline-none transition-colors ${
                editedScore === PASS
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 focus:border-emerald-400'
                  : 'border-red-200 bg-red-50 text-red-700 focus:border-red-400'
              }`}
            >
              <option value={PASS}>Зачёт</option>
              <option value={FAIL}>Незачёт</option>
            </select>
          ) : scoreLabel ? (
            <ScoreBadge score={editedScore} label={scoreLabel} max={scoreMax} />
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={editedScore}
                onChange={(e) => {
                  setEditedScore(e.target.value);
                  setScoreLabel(null);
                }}
                className="w-20 p-2 border border-slate-200 rounded-xl text-lg font-bold text-center focus:outline-none focus:border-indigo-400 cursor-text bg-slate-50 hover:border-slate-300 transition-colors"
                placeholder="-"
              />
              <span className="text-slate-400 text-sm font-medium shrink-0">из</span>
              <input
                type="text"
                inputMode="decimal"
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
                className="w-20 p-2 border border-slate-200 rounded-xl text-lg font-bold text-center focus:outline-none focus:border-indigo-400 cursor-text bg-slate-50 hover:border-slate-300 transition-colors"
                placeholder="5"
              />
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
            Комментарий
          </p>
          {isEditing ? (
            <textarea
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-indigo-400 cursor-text"
            />
          ) : (
            <CommentBlock text={editedComment} />
          )}
        </div>
      </div>

      {criteria && (
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
            Критерии
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-64 overflow-y-auto">
            {Object.entries(criteria).map(([key, val]: [string, any]) => (
              <div
                key={key}
                title={val.comment || undefined}
                className="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-1.5 text-xs cursor-default"
              >
                <span className="font-semibold text-slate-600 w-8 shrink-0 pt-0.5">{key}</span>
                <span className="text-indigo-600 font-bold shrink-0 pt-0.5">
                  {val.score !== undefined ? val.score : val.result}
                </span>
                {val.max !== undefined && (
                  <span className="text-slate-300 shrink-0 pt-0.5">/{val.max}</span>
                )}
                {val.comment && <span className="text-slate-400 leading-tight">{val.comment}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isGeneration && errors.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
            Ошибки <span className="text-slate-500">({errors.length})</span>
          </p>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {errors.map((err: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1 items-center">
                  {err.original && (
                    <span className="text-red-500 line-through">{err.original}</span>
                  )}
                  {err.corrected && (
                    <span className="text-emerald-600 font-medium">→ {err.corrected}</span>
                  )}
                  {err.comment && <span className="text-slate-400 text-xs">{err.comment}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 py-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
            {isGeneration ? 'Сгенерированный результат' : 'Текст'}
          </p>
          <div className="flex items-center gap-2">
            <CopyBtn
              text={isGeneration || showCorrected || isEditing ? editedCorrected : originalText}
            />
            {!isEditing && !isGeneration && (
              <div className="flex bg-slate-100 rounded-lg p-0.5">
                <button
                  onClick={() => setShowCorrected(false)}
                  className={`cursor-pointer text-xs px-2.5 py-1 rounded-md transition-colors ${
                    !showCorrected
                      ? 'bg-white text-slate-700 shadow-sm font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  С ошибками
                </button>
                <button
                  onClick={() => setShowCorrected(true)}
                  className={`cursor-pointer text-xs px-2.5 py-1 rounded-md transition-colors ${
                    showCorrected
                      ? 'bg-white text-slate-700 shadow-sm font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Исправленный
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing || showCorrected || isGeneration ? (
          <textarea
            value={editedCorrected}
            onChange={(e) => setEditedCorrected(e.target.value)}
            readOnly={isGeneration && !isEditing}
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
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Сохраняем...
            </>
          ) : saved ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Сохранено!
            </>
          ) : (
            <>Сохранить результат</>
          )}
        </button>
      </div>
    </div>
  );
};
