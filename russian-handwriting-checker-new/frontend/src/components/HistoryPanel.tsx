import { useEffect, useState, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, FileText, User2, Loader2, Trash2, Pencil, X,
  CheckCircle2, Copy, Check, Search, FolderOpen, Plus, FolderClosed, AlertCircle,
} from 'lucide-react';
import api from '../api';
import { useToast } from './Toast';

interface Folder { id: string; name: string; description?: string; }

interface CheckRecord {
  id: string;
  filename: string;
  title?: string | null;
  pupil_name?: string;
  score: number;
  score_max: number;
  comment: string;
  corrected_text: string;
  original_text?: string;
  folder_id?: string | null;
  work_date?: string;
  created_at: string;
}

interface EditForm {
  score: string;
  scoreMax: string;
  comment: string;
  corrected_text: string;
  pupil_name: string;
  workDate: string;
  folder_id: string;
}

type DateFilter = 'all' | 'week' | 'month' | 'custom';
type SortKey = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';

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
    <button onClick={handle} className="cursor-pointer flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors">
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Скопировано' : 'Копировать'}
    </button>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
      <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
      <span className="text-sm text-red-700 flex-1">Удалить запись?</span>
      <button
        onClick={onCancel}
        className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
      >
        Отмена
      </button>
      <button
        onClick={onConfirm}
        className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
      >
        Удалить
      </button>
    </div>
  );
}

function FolderSection({ folders, onAdd, onUpdate, onDelete }: {
  folders: Folder[];
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doAdd = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    await onAdd(newName.trim());
    setNewName('');
    setBusy(false);
  };

  const doUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdate(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      {folders.map(f => (
        <div key={f.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderClosed className="h-4 w-4 text-amber-500 shrink-0" />
            {editingId === f.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doUpdate(f.id); if (e.key === 'Escape') setEditingId(null); }}
                  className="cursor-text flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none"
                />
                <button onClick={() => doUpdate(f.id)} className="cursor-pointer text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg">OK</button>
                <button onClick={() => setEditingId(null)} className="cursor-pointer p-1 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-slate-700">{f.name}</span>
                <button onClick={() => { setEditingId(f.id); setEditName(f.name); }} className="cursor-pointer p-1 text-slate-300 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setConfirmDeleteId(f.id)} className="cursor-pointer p-1 text-slate-300 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
              </>
            )}
          </div>
          {confirmDeleteId === f.id && (
            <div className="ml-6">
              <ConfirmDelete
                onConfirm={async () => { await onDelete(f.id); setConfirmDeleteId(null); }}
                onCancel={() => setConfirmDeleteId(null)}
              />
            </div>
          )}
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') doAdd(); }}
          placeholder="Название папки..."
          className="cursor-text flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={doAdd}
          disabled={busy || !newName.trim()}
          className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl disabled:opacity-40 disabled:cursor-default transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />Создать
        </button>
      </div>
    </div>
  );
}

function EditPanel({ check, folders, onSave, onCancel }: {
  check: CheckRecord;
  folders: Folder[];
  onSave: (id: string, form: EditForm) => Promise<void>;
  onCancel: () => void;
}) {
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
    try { await onSave(check.id, form); } finally { setSaving(false); }
  };

  return (
    <div className="border-t border-slate-100 px-4 py-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Ученик</label>
          <input value={form.pupil_name} onChange={e => setForm(f => ({ ...f, pupil_name: e.target.value }))}
            placeholder="Имя ученика"
            className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Оценка</label>
          <div className="flex items-center gap-2">
            <input type="text" inputMode="decimal" value={form.score} onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
              placeholder="0" className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-400" />
            <span className="text-slate-400 text-sm shrink-0">из</span>
            <input type="text" inputMode="decimal" value={form.scoreMax} onChange={e => setForm(f => ({ ...f, scoreMax: e.target.value }))}
              placeholder="5" className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-center focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Дата работы</label>
          <input type="datetime-local" value={form.workDate} onChange={e => setForm(f => ({ ...f, workDate: e.target.value }))}
            className="cursor-pointer w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Папка</label>
          <select value={form.folder_id} onChange={e => setForm(f => ({ ...f, folder_id: e.target.value }))}
            className="cursor-pointer w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 bg-white">
            <option value="">Без папки</option>
            {folders.map(fl => <option key={fl.id} value={fl.id}>{fl.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Комментарий</label>
        <textarea value={form.comment} onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
          rows={3} className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:border-indigo-400" />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Исправленный текст</label>
        <textarea value={form.corrected_text} onChange={e => setForm(f => ({ ...f, corrected_text: e.target.value }))}
          rows={4} className="cursor-text w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono resize-none focus:outline-none focus:border-indigo-400" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <X className="h-3.5 w-3.5" />Отмена
        </button>
        <button onClick={handleSave} disabled={saving}
          className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors disabled:bg-slate-300 disabled:cursor-default">
          {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Сохраняем...</> : <>Сохранить</>}
        </button>
      </div>
    </div>
  );
}

export default function HistoryPanel() {
  const toast = useToast();
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [showFolderMgr, setShowFolderMgr] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sort, setSort] = useState<SortKey>('date_desc');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [sessionStart] = useState(() => Date.now());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFolderId, setBulkFolderId] = useState('');
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/check/history').then(r => r.data.map((c: any) => ({ ...c, score_max: c.score_max ?? 5 }))),
      api.get('/api/folders/').then(r => r.data).catch(() => []),
    ]).then(([ch, fl]) => {
      setChecks(ch);
      setFolders(fl);
    }).finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/check/${id}`);
      setChecks(prev => prev.filter(c => c.id !== id));
      if (expandedId === id) setExpandedId(null);
      setConfirmDeleteId(null);
    } catch { toast.error('Не удалось удалить запись'); }
  };

  const handleSaveEdit = async (id: string, form: EditForm) => {
    const scoreNum = parseFloat(form.score) || 0;
    const maxNum = parseFloat(form.scoreMax) || 5;
    const workDateIso = form.workDate ? new Date(form.workDate).toISOString() : undefined;
    await api.put(`/api/check/${id}`, {
      score: scoreNum, score_max: maxNum, comment: form.comment,
      corrected_text: form.corrected_text, pupil_name: form.pupil_name || null,
      work_date: workDateIso, folder_id: form.folder_id || null,
    });
    setChecks(prev => prev.map(c => c.id === id
      ? { ...c, score: scoreNum, score_max: maxNum, comment: form.comment, corrected_text: form.corrected_text, pupil_name: form.pupil_name || undefined, work_date: workDateIso, folder_id: form.folder_id || null }
      : c
    ));
    setEditingId(null);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 2500);
  };

  const handleAddFolder = async (name: string) => {
    const res = await api.post('/api/folders/', { name });
    setFolders(prev => [...prev, res.data]);
  };

  const handleUpdateFolder = async (id: string, name: string) => {
    const res = await api.put(`/api/folders/${id}`, { name });
    setFolders(prev => prev.map(f => f.id === id ? res.data : f));
  };

  const handleDeleteFolder = async (id: string) => {
    await api.delete(`/api/folders/${id}`);
    setFolders(prev => prev.filter(f => f.id !== id));
    if (filterFolder === id) setFilterFolder('all');
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return checks
      .filter(c => {
        const t = new Date(c.created_at).getTime();
        if (dateFilter === 'week' && t < sessionStart - 7 * 86400_000) return false;
        if (dateFilter === 'month' && t < sessionStart - 30 * 86400_000) return false;
        if (dateFilter === 'custom') {
          if (fromDate && t < new Date(fromDate).getTime()) return false;
          if (toDate && t > new Date(toDate + 'T23:59:59.999').getTime()) return false;
        }
        if (q && !c.pupil_name?.toLowerCase().includes(q) && !c.filename?.toLowerCase().includes(q) && !c.title?.toLowerCase().includes(q)) return false;
        if (filterFolder !== 'all' && c.folder_id !== filterFolder) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === 'date_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sort === 'date_asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        const pa = a.score_max > 0 ? a.score / a.score_max : 0;
        const pb = b.score_max > 0 ? b.score / b.score_max : 0;
        return sort === 'score_desc' ? pb - pa : pa - pb;
      });
  }, [checks, search, dateFilter, sort, sessionStart, filterFolder, fromDate, toDate]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const students = new Set(filtered.map(c => c.pupil_name).filter(Boolean)).size;
    const scored = filtered.filter(c => c.score != null && c.score_max != null);
    const totalScore = scored.reduce((s, c) => s + c.score, 0);
    const totalMax = scored.reduce((s, c) => s + c.score_max, 0);
    const avgPct = totalMax > 0 ? Math.round(totalScore / totalMax * 100) : 0;
    return { total: filtered.length, students, avgPct };
  }, [filtered]);

  const toggleSelect = (id: string) => setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });

  const isAllSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id));

  const toggleAll = () => {
    if (isAllSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(c => c.id)));
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => api.delete(`/api/check/${id}`).catch(() => {})));
    setChecks(prev => prev.filter(c => !ids.includes(c.id)));
    if (ids.includes(expandedId ?? '')) setExpandedId(null);
    if (ids.includes(editingId ?? '')) setEditingId(null);
    setSelectedIds(new Set());
    setBulkDeleteConfirm(false);
    toast.success(`Удалено ${ids.length} записей`);
  };

  const handleBulkMoveToFolder = async () => {
    if (!bulkFolderId) return;
    const ids = [...selectedIds];
    const fid = bulkFolderId;
    await Promise.all(ids.map(id => api.put(`/api/check/${id}`, { folder_id: fid }).catch(() => {})));
    setChecks(prev => prev.map(c => ids.includes(c.id) ? { ...c, folder_id: fid } : c));
    setSelectedIds(new Set());
    setBulkFolderId('');
    toast.success(`Перемещено ${ids.length} записей`);
  };

  const handleBulkRemoveFromFolder = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => api.put(`/api/check/${id}`, { folder_id: null }).catch(() => {})));
    setChecks(prev => prev.map(c => ids.includes(c.id) ? { ...c, folder_id: null } : c));
    setSelectedIds(new Set());
    toast.success(`Убрано из папки ${ids.length} записей`);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />Загружаем историю...
    </div>
  );

  if (checks.length === 0) return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">История пуста</p>
      <p className="text-slate-400 text-sm mt-1">Проверьте работу и сохраните результат</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Folder manager */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowFolderMgr(v => !v)}
          className="cursor-pointer w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FolderOpen className="h-4 w-4 text-amber-500" />
            Папки
            {folders.length > 0 && <span className="text-xs text-slate-400 font-normal">({folders.length})</span>}
          </div>
          {showFolderMgr ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {showFolderMgr && (
          <div className="border-t border-slate-100 px-4 py-4">
            <FolderSection folders={folders} onAdd={handleAddFolder} onUpdate={handleUpdateFolder} onDelete={handleDeleteFolder} />
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Проверок</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
            <p className="text-2xl font-bold text-slate-800">{stats.students}</p>
            <p className="text-xs text-slate-400 mt-0.5">Учеников</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
            <p className={`text-2xl font-bold ${stats.avgPct >= 80 ? 'text-emerald-600' : stats.avgPct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{stats.avgPct}%</p>
            <p className="text-xs text-slate-400 mt-0.5">Средний процент</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по ученику, названию или файлу..."
            className="cursor-text w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400" />
        </div>

        <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5">
          {(['all', 'week', 'month', 'custom'] as DateFilter[]).map(f => (
            <button key={f} onClick={() => setDateFilter(f)}
              className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${dateFilter === f ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
              {f === 'all' ? 'Всё' : f === 'week' ? 'Неделя' : f === 'month' ? 'Месяц' : 'Период'}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="cursor-pointer text-sm border border-slate-200 bg-white rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:border-indigo-400"
            />
            <span className="text-xs text-slate-400">—</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="cursor-pointer text-sm border border-slate-200 bg-white rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:border-indigo-400"
            />
          </div>
        )}

        {folders.length > 0 && (
          <select value={filterFolder} onChange={e => setFilterFolder(e.target.value)}
            className="cursor-pointer text-sm border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-slate-600 focus:outline-none focus:border-indigo-400">
            <option value="all">Все папки</option>
            <option value="">Без папки</option>
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        )}

        <select value={sort} onChange={e => setSort(e.target.value as SortKey)}
          className="cursor-pointer text-sm border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-slate-600 focus:outline-none focus:border-indigo-400">
          <option value="date_desc">По дате ↓</option>
          <option value="date_asc">По дате ↑</option>
          <option value="score_desc">По оценке ↓</option>
          <option value="score_asc">По оценке ↑</option>
        </select>
      </div>

      <div className="flex items-center justify-between min-h-[1.25rem]">
        {filtered.length !== checks.length && (
          <p className="text-xs text-slate-400">Показано {filtered.length} из {checks.length}</p>
        )}
        {filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 ml-auto transition-colors"
          >
            {isAllSelected ? 'Снять выделение' : 'Выбрать все'}
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400">Ничего не найдено</p>
          </div>
        ) : filtered.map(check => {
          const folderName = check.folder_id ? folders.find(f => f.id === check.folder_id)?.name : null;
          const displayTitle = check.title || check.filename;
          const textPreview = (check.original_text || check.corrected_text || '').slice(0, 90).trim();
          const isDeleting = confirmDeleteId === check.id;

          return (
            <div key={check.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center">
                <div className="pl-4 py-4 shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(check.id)}
                    onChange={() => toggleSelect(check.id)}
                    onClick={e => e.stopPropagation()}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
                <button
                  onClick={() => { setExpandedId(expandedId === check.id ? null : check.id); setEditingId(null); setConfirmDeleteId(null); }}
                  className="cursor-pointer flex-1 flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <ScoreCircle score={check.score} max={check.score_max} />
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {check.pupil_name && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          <User2 className="h-3 w-3" />{check.pupil_name}
                        </span>
                      )}
                      {folderName && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <FolderClosed className="h-3 w-3" />{folderName}
                        </span>
                      )}
                      {savedId === check.id && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />Сохранено
                        </span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-sm font-medium text-slate-700 truncate">{displayTitle}</p>
                    {/* Text preview */}
                    {textPreview && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {textPreview}{textPreview.length >= 90 ? '…' : ''}
                      </p>
                    )}
                    <p className="text-xs text-slate-300 mt-0.5">{formatDate(check.work_date || check.created_at)}</p>
                  </div>
                  {expandedId === check.id ? <ChevronUp className="h-4 w-4 text-slate-300 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-300 shrink-0" />}
                </button>

                <div className="flex items-center gap-1 mr-3 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); setExpandedId(check.id); setEditingId(editingId === check.id ? null : check.id); setConfirmDeleteId(null); }}
                    className={`cursor-pointer p-2 rounded-lg transition-colors ${editingId === check.id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDeleteId(isDeleting ? null : check.id); }}
                    className={`cursor-pointer p-2 rounded-lg transition-colors ${isDeleting ? 'text-red-500 bg-red-50' : 'text-slate-300 hover:text-red-500 hover:bg-red-50'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Inline delete confirmation */}
              {isDeleting && (
                <div className="px-4 pb-3">
                  <ConfirmDelete
                    onConfirm={() => handleDelete(check.id)}
                    onCancel={() => setConfirmDeleteId(null)}
                  />
                </div>
              )}

              {/* Expanded content */}
              {expandedId === check.id && !isDeleting && (
                editingId === check.id ? (
                  <EditPanel check={check} folders={folders} onSave={handleSaveEdit} onCancel={() => setEditingId(null)} />
                ) : (
                  <div className="border-t border-slate-100 px-4 py-4 space-y-4">
                    {check.comment && (
                      <p className="text-sm text-slate-600 leading-relaxed">{check.comment}</p>
                    )}
                    {check.original_text && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Исходный текст</p>
                        <div className="flex justify-end mb-1"><CopyBtn text={check.original_text} /></div>
                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                          {check.original_text}
                        </div>
                      </div>
                    )}
                    {check.corrected_text && (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Исправленный текст</p>
                        <div className="flex justify-end mb-1"><CopyBtn text={check.corrected_text} /></div>
                        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                          {check.corrected_text}
                        </div>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 whitespace-nowrap">
          <span className="text-sm font-medium text-slate-200">{selectedIds.size} выбрано</span>
          <div className="w-px h-4 bg-slate-700" />
          <button
            onClick={() => setSelectedIds(new Set())}
            className="cursor-pointer text-xs text-slate-400 hover:text-white transition-colors"
          >
            Снять
          </button>
          {folders.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-700" />
              <select
                value={bulkFolderId}
                onChange={e => setBulkFolderId(e.target.value)}
                className="cursor-pointer text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg pl-2 pr-6 py-1.5 focus:outline-none"
              >
                <option value="">Папка...</option>
                {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
              <button
                onClick={handleBulkMoveToFolder}
                disabled={!bulkFolderId}
                className="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-default px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                В папку
              </button>
              <button
                onClick={handleBulkRemoveFromFolder}
                className="cursor-pointer text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Убрать из папки
              </button>
            </>
          )}
          <div className="w-px h-4 bg-slate-700" />
          {bulkDeleteConfirm ? (
            <>
              <span className="text-xs text-red-400">Удалить {selectedIds.size}?</span>
              <button
                onClick={handleBulkDelete}
                className="cursor-pointer text-xs bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Да
              </button>
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="cursor-pointer text-xs text-slate-400 hover:text-white transition-colors px-2"
              >
                Нет
              </button>
            </>
          ) : (
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="cursor-pointer text-xs bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              Удалить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
