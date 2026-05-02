import { useEffect, useState, useMemo } from 'react';
import { User2, Loader2, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Users, FolderClosed, AlertCircle } from 'lucide-react';
import api from '../api';

interface CheckRecord {
  id: string;
  filename: string;
  title?: string | null;
  original_text?: string;
  corrected_text?: string;
  pupil_name?: string;
  score: number;
  score_max: number;
  comment: string;
  folder_id?: string | null;
  work_date?: string;
  created_at: string;
}

interface Group { id: string; name: string; description?: string; }
interface Folder { id: string; name: string; }

interface StudentStats {
  name: string;
  checks: CheckRecord[];
  avgPct: number;
  avgScore: number;
  best: number;
  worst: number;
  lastDate: string;
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function scoreColor(pct: number) {
  return pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
}

function ScoreBar({ pct }: { pct: number }) {
  const bar = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs font-bold w-9 text-right tabular-nums ${scoreColor(pct)}`}>{pct}%</span>
    </div>
  );
}

function CheckMini({ check, folders }: { check: CheckRecord; folders: Folder[] }) {
  const pct = check.score_max > 0 ? check.score / check.score_max : 0;
  const color =
    pct >= 0.8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    pct >= 0.5 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                 'text-red-600 bg-red-50 border-red-200';
  const folderName = check.folder_id ? folders.find(f => f.id === check.folder_id)?.name : null;
  const subtitle = check.title || (check.original_text || check.corrected_text || '').slice(0, 70);
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
      <div className={`w-9 h-9 rounded-lg border-2 flex items-center justify-center font-bold text-sm shrink-0 ${color}`}>
        {check.score}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm text-slate-600 truncate">{check.filename}</p>
          {folderName && (
            <span className="flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">
              <FolderClosed className="h-2.5 w-2.5" />{folderName}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{subtitle}</p>}
      </div>
      <p className="text-xs text-slate-300 shrink-0">{formatDate(check.work_date || check.created_at)}</p>
    </div>
  );
}

function GroupSection({ groups, pupils, pupilGroups, onAddGroup, onUpdateGroup, onDeleteGroup, onAssignGroup }: {
  groups: Group[];
  pupils: string[];
  pupilGroups: Map<string, string>;
  onAddGroup: (name: string) => Promise<void>;
  onUpdateGroup: (id: string, name: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onAssignGroup: (pupilName: string, groupId: string) => Promise<void>;
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doAdd = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    await onAddGroup(newName.trim());
    setNewName('');
    setBusy(false);
  };

  const doUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await onUpdateGroup(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Группы</p>
        {groups.map(g => (
          <div key={g.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400 shrink-0" />
              {editingId === g.id ? (
                <>
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') doUpdate(g.id); if (e.key === 'Escape') setEditingId(null); }}
                    className="cursor-text flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none" />
                  <button onClick={() => doUpdate(g.id)} className="cursor-pointer text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg">OK</button>
                  <button onClick={() => setEditingId(null)} className="cursor-pointer p-1 text-slate-400 hover:text-slate-600"><X className="h-3.5 w-3.5" /></button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{g.name}</span>
                  <span className="text-xs text-slate-400">{[...pupilGroups.entries()].filter(([, gid]) => gid === g.id).length} уч.</span>
                  <button onClick={() => { setEditingId(g.id); setEditName(g.name); }} className="cursor-pointer p-1 text-slate-300 hover:text-indigo-600"><Pencil className="h-3.5 w-3.5" /></button>
                  <button
                    onClick={() => setConfirmDeleteId(confirmDeleteId === g.id ? null : g.id)}
                    className={`cursor-pointer p-1 rounded ${confirmDeleteId === g.id ? 'text-red-500' : 'text-slate-300 hover:text-red-500'}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            {confirmDeleteId === g.id && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700 flex-1">Удалить группу? Ученики останутся без группы.</span>
                <button onClick={() => setConfirmDeleteId(null)} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors">Отмена</button>
                <button onClick={() => { onDeleteGroup(g.id); setConfirmDeleteId(null); }} className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors">Удалить</button>
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <input value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doAdd(); }}
            placeholder="Название группы..."
            className="cursor-text flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400" />
          <button onClick={doAdd} disabled={busy || !newName.trim()}
            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl disabled:opacity-40 disabled:cursor-default transition-colors">
            <Plus className="h-3.5 w-3.5" />Создать
          </button>
        </div>
      </div>

      {pupils.length > 0 && groups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Назначение учеников</p>
          {pupils.map(pupil => (
            <div key={pupil} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-slate-700 truncate">{pupil}</span>
              <select
                value={pupilGroups.get(pupil) || ''}
                onChange={e => onAssignGroup(pupil, e.target.value)}
                className="cursor-pointer text-xs border border-slate-200 bg-white rounded-lg pl-2 pr-6 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 max-w-[160px]"
              >
                <option value="">Без группы</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentsPanel() {
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pupilGroups, setPupilGroups] = useState<Map<string, string>>(new Map());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [showGroupMgr, setShowGroupMgr] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterFolder, setFilterFolder] = useState<string>('all');

  useEffect(() => {
    Promise.all([
      api.get('/api/check/history').then(r => r.data.map((c: CheckRecord) => ({ ...c, score_max: c.score_max ?? 5 }))),
      api.get('/api/groups/').then(r => r.data).catch(() => []),
      api.get('/api/groups/pupils').then(r => r.data).catch(() => []),
      api.get('/api/folders/').then(r => r.data).catch(() => []),
    ]).then(([ch, gr, pg, fl]) => {
      setChecks(ch);
      setGroups(gr);
      const map = new Map<string, string>();
      for (const a of pg) map.set(a.pupil_name, a.group_id);
      setPupilGroups(map);
      setFolders(fl);
    }).finally(() => setLoading(false));
  }, []);

  const handleAddGroup = async (name: string) => {
    const res = await api.post('/api/groups/', { name });
    setGroups(prev => [...prev, res.data]);
  };

  const handleUpdateGroup = async (id: string, name: string) => {
    const res = await api.put(`/api/groups/${id}`, { name });
    setGroups(prev => prev.map(g => g.id === id ? res.data : g));
  };

  const handleDeleteGroup = async (id: string) => {
    await api.delete(`/api/groups/${id}`);
    setGroups(prev => prev.filter(g => g.id !== id));
    setPupilGroups(prev => {
      const next = new Map(prev);
      next.forEach((gid, name) => { if (gid === id) next.delete(name); });
      return next;
    });
    if (filterGroup === id) setFilterGroup('all');
  };

  const handleAssignGroup = async (pupilName: string, groupId: string) => {
    await api.post('/api/groups/pupils/assign', { pupil_name: pupilName, group_id: groupId || null });
    setPupilGroups(prev => {
      const next = new Map(prev);
      if (groupId) next.set(pupilName, groupId);
      else next.delete(pupilName);
      return next;
    });
  };

  const folderFilteredChecks = useMemo(() => {
    if (filterFolder === 'all') return checks;
    if (filterFolder === '') return checks.filter(c => !c.folder_id);
    return checks.filter(c => c.folder_id === filterFolder);
  }, [checks, filterFolder]);

  const students = useMemo<StudentStats[]>(() => {
    const map = new Map<string, CheckRecord[]>();
    for (const c of folderFilteredChecks) {
      const key = c.pupil_name?.trim() || '\x00';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    const result: StudentStats[] = [];
    map.forEach((cs, key) => {
      if (key === '\x00') return;
      const scored = cs.filter(c => c.score != null && c.score_max != null);
      const totalScore = scored.reduce((s, c) => s + c.score, 0);
      const totalMax = scored.reduce((s, c) => s + c.score_max, 0);
      const avgPct = totalMax > 0 ? Math.round(totalScore / totalMax * 100) : 0;
      const avgScore = scored.length > 0 ? Math.round((totalScore / scored.length) * 10) / 10 : 0;
      const pcts = scored.map(c => c.score_max > 0 ? (c.score / c.score_max) * 100 : 0);
      result.push({
        name: key,
        checks: [...cs].sort((a, b) => {
          const da = a.work_date || a.created_at;
          const db = b.work_date || b.created_at;
          return db.localeCompare(da);
        }),
        avgPct, avgScore,
        best: pcts.length ? Math.round(Math.max(...pcts)) : 0,
        worst: pcts.length ? Math.round(Math.min(...pcts)) : 0,
        lastDate: cs.reduce((latest, c) => {
          const d = c.work_date || c.created_at;
          return d > latest ? d : latest;
        }, ''),
      });
    });
    return result.sort((a, b) => b.checks.length - a.checks.length);
  }, [folderFilteredChecks]);

  const filteredStudents = useMemo(() => {
    if (filterGroup === 'all') return students;
    if (filterGroup === '') return students.filter(s => !pupilGroups.has(s.name));
    return students.filter(s => pupilGroups.get(s.name) === filterGroup);
  }, [students, filterGroup, pupilGroups]);

  const overallAvg = useMemo(() => {
    const groupChecks = filteredStudents.flatMap(s => s.checks).filter(c => c.score != null && c.score_max != null);
    if (!groupChecks.length) return 0;
    const totalScore = groupChecks.reduce((s, c) => s + c.score, 0);
    const totalMax = groupChecks.reduce((s, c) => s + c.score_max, 0);
    return totalMax > 0 ? Math.round(totalScore / totalMax * 100) : 0;
  }, [filteredStudents]);

  const allPupils = useMemo(() => [...new Set(checks.map(c => c.pupil_name).filter(Boolean) as string[])].sort(), [checks]);

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />Загрузка...
    </div>
  );

  if (students.length === 0 && !loading) return (
    <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
      <User2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-500 font-medium">Нет данных об учениках</p>
      <p className="text-slate-400 text-sm mt-1">Укажите имя ученика при сохранении результата</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Group manager */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowGroupMgr(v => !v)}
          className="cursor-pointer w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-indigo-500" />
            Группы
            {groups.length > 0 && <span className="text-xs text-slate-400 font-normal">({groups.length})</span>}
          </div>
          {showGroupMgr ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {showGroupMgr && (
          <div className="border-t border-slate-100 px-4 py-4">
            <GroupSection
              groups={groups}
              pupils={allPupils}
              pupilGroups={pupilGroups}
              onAddGroup={handleAddGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onAssignGroup={handleAssignGroup}
            />
          </div>
        )}
      </div>

      {/* Filters */}
      {(groups.length > 0 || folders.length > 0) && (
        <div className="flex flex-wrap gap-3 items-center">
          {groups.length > 0 && (
            <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5 flex-wrap">
              <button onClick={() => setFilterGroup('all')}
                className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${filterGroup === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                Все
              </button>
              <button onClick={() => setFilterGroup('')}
                className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${filterGroup === '' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                Без группы
              </button>
              {groups.map(g => (
                <button key={g.id} onClick={() => setFilterGroup(g.id)}
                  className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${filterGroup === g.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}>
                  {g.name}
                </button>
              ))}
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
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{filteredStudents.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Учеников</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{filteredStudents.reduce((s, st) => s + st.checks.length, 0)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Работ всего</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
          <p className={`text-2xl font-bold ${scoreColor(overallAvg)}`}>{overallAvg}%</p>
          <p className="text-xs text-slate-400 mt-0.5">Средний процент правильных ответов</p>
        </div>
      </div>

      {/* Student cards */}
      <div className="space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400">Нет учеников в этой группе</p>
          </div>
        ) : filteredStudents.map(student => {
          const groupId = pupilGroups.get(student.name);
          const groupName = groupId ? groups.find(g => g.id === groupId)?.name : null;
          return (
            <div key={student.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedName(expandedName === student.name ? null : student.name)}
                className="cursor-pointer w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  <User2 className="h-5 w-5 text-indigo-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                    <span className={`text-sm font-bold tabular-nums ${scoreColor(student.avgPct)}`}>
                      {student.avgScore.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400">ср. балл</span>
                    {groupName && (
                      <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        <Users className="h-2.5 w-2.5" />{groupName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {student.checks.length}{' '}
                    {student.checks.length === 1 ? 'работа' : student.checks.length < 5 ? 'работы' : 'работ'}
                    {' · '}последняя {formatDate(student.lastDate)}
                  </p>
                  <div className="mt-2 max-w-xs">
                    <ScoreBar pct={student.avgPct} />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-600 font-medium">▲ {student.best}%</span>
                    <span className="text-red-500 font-medium">▼ {student.worst}%</span>
                  </div>
                  {expandedName === student.name
                    ? <ChevronUp className="h-4 w-4 text-slate-300" />
                    : <ChevronDown className="h-4 w-4 text-slate-300" />
                  }
                </div>
              </button>

              {expandedName === student.name && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">Работы</p>
                  {student.checks.map(c => <CheckMini key={c.id} check={c} folders={folders} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
