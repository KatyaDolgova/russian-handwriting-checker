import { useEffect, useState, useMemo } from 'react';
import {
  User2,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  X,
} from 'lucide-react';
import api from '@/api';
import type { CheckRecord, Folder, Group } from '@/types';
import { formatDate, scoreColor } from '@/utils';
import { ScoreBar, CheckMini, GroupSection } from '@/components/ui';

interface StudentStats {
  name: string;
  checks: CheckRecord[];
  avgPct: number;
  avgScore: number;
  best: number;
  worst: number;
  lastDate: string;
}

type SortKey = 'works_desc' | 'pct_desc' | 'pct_asc' | 'name_asc' | 'date_desc';
type PctFilter = 'all' | 'low' | 'mid' | 'high';

export const StudentsPanel = () => {
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [pupilGroups, setPupilGroups] = useState<Map<string, string>>(new Map());
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [showGroupMgr, setShowGroupMgr] = useState(false);

  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('works_desc');
  const [pctFilter, setPctFilter] = useState<PctFilter>('all');

  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set());
  const [bulkGroupId, setBulkGroupId] = useState('');

  useEffect(() => {
    Promise.all([
      api
        .get('/api/check/history')
        .then((r) => r.data.map((c: CheckRecord) => ({ ...c, score_max: c.score_max ?? 5 }))),
      api.get('/api/groups/').then((r) => r.data).catch(() => []),
      api.get('/api/groups/pupils').then((r) => r.data).catch(() => []),
      api.get('/api/folders/').then((r) => r.data).catch(() => []),
    ])
      .then(([ch, gr, pg, fl]) => {
        setChecks(ch);
        setGroups(gr);
        const map = new Map<string, string>();
        for (const a of pg) map.set(a.pupil_name, a.group_id);
        setPupilGroups(map);
        setFolders(fl);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAddGroup = async (name: string) => {
    const res = await api.post('/api/groups/', { name });
    setGroups((prev) => [...prev, res.data]);
  };
  const handleUpdateGroup = async (id: string, name: string) => {
    const res = await api.put(`/api/groups/${id}`, { name });
    setGroups((prev) => prev.map((g) => (g.id === id ? res.data : g)));
  };
  const handleDeleteGroup = async (id: string) => {
    await api.delete(`/api/groups/${id}`);
    setGroups((prev) => prev.filter((g) => g.id !== id));
    setPupilGroups((prev) => {
      const next = new Map(prev);
      next.forEach((gid, name) => { if (gid === id) next.delete(name); });
      return next;
    });
    if (filterGroup === id) setFilterGroup('all');
  };

  const handleAssignGroup = async (pupilName: string, groupId: string) => {
    await api.post('/api/groups/pupils/assign', {
      pupil_name: pupilName,
      group_id: groupId || null,
    });
    setPupilGroups((prev) => {
      const next = new Map(prev);
      if (groupId) next.set(pupilName, groupId);
      else next.delete(pupilName);
      return next;
    });
  };

  const handleBulkAssignGroup = async () => {
    if (!bulkGroupId) return;
    const names = [...selectedNames];
    await Promise.all(names.map((n) => handleAssignGroup(n, bulkGroupId)));
    setSelectedNames(new Set());
    setBulkGroupId('');
  };

  const handleBulkRemoveFromGroup = async () => {
    const names = [...selectedNames];
    await Promise.all(names.map((n) => handleAssignGroup(n, '')));
    setSelectedNames(new Set());
  };

  const resetFilters = () => {
    setSearch('');
    setFilterGroup('all');
    setFilterFolder('all');
    setPctFilter('all');
    setSort('works_desc');
  };

  const toggleSelect = (name: string) =>
    setSelectedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const folderFilteredChecks = useMemo(() => {
    if (filterFolder === 'all') return checks;
    if (filterFolder === '') return checks.filter((c) => !c.folder_id);
    return checks.filter((c) => c.folder_id === filterFolder);
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
      const scored = cs.filter((c) => c.score != null && c.score_max != null);
      const totalScore = scored.reduce((s, c) => s + (c.score ?? 0), 0);
      const totalMax = scored.reduce((s, c) => s + (c.score_max ?? 0), 0);
      const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
      const avgScore = scored.length > 0 ? Math.round((totalScore / scored.length) * 10) / 10 : 0;
      const pcts = scored.map((c) =>
        c.score_max != null && c.score_max > 0 ? ((c.score ?? 0) / c.score_max) * 100 : 0,
      );
      result.push({
        name: key,
        checks: [...cs].sort((a, b) => {
          const da = a.work_date || a.created_at;
          const db = b.work_date || b.created_at;
          return db.localeCompare(da);
        }),
        avgPct,
        avgScore,
        best: pcts.length ? Math.round(Math.max(...pcts)) : 0,
        worst: pcts.length ? Math.round(Math.min(...pcts)) : 0,
        lastDate: cs.reduce((latest, c) => {
          const d = c.work_date || c.created_at;
          return d > latest ? d : latest;
        }, ''),
      });
    });
    return result;
  }, [folderFilteredChecks]);

  const displayedStudents = useMemo(() => {
    let result = students;

    if (filterGroup !== 'all') {
      if (filterGroup === '') result = result.filter((s) => !pupilGroups.has(s.name));
      else result = result.filter((s) => pupilGroups.get(s.name) === filterGroup);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (pctFilter === 'low') result = result.filter((s) => s.avgPct < 50);
    else if (pctFilter === 'mid') result = result.filter((s) => s.avgPct >= 50 && s.avgPct < 80);
    else if (pctFilter === 'high') result = result.filter((s) => s.avgPct >= 80);

    return [...result].sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name, 'ru');
      if (sort === 'pct_desc') return b.avgPct - a.avgPct;
      if (sort === 'pct_asc') return a.avgPct - b.avgPct;
      if (sort === 'works_desc') return b.checks.length - a.checks.length;
      if (sort === 'date_desc') return b.lastDate.localeCompare(a.lastDate);
      return 0;
    });
  }, [students, filterGroup, pupilGroups, search, pctFilter, sort]);

  const overallAvg = useMemo(() => {
    const scored = displayedStudents
      .flatMap((s) => s.checks)
      .filter((c) => c.score != null && c.score_max != null);
    if (!scored.length) return 0;
    const totalScore = scored.reduce((s, c) => s + (c.score ?? 0), 0);
    const totalMax = scored.reduce((s, c) => s + (c.score_max ?? 0), 0);
    return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  }, [displayedStudents]);

  const isAllSelected =
    displayedStudents.length > 0 && displayedStudents.every((s) => selectedNames.has(s.name));

  const toggleAll = () => {
    if (isAllSelected) setSelectedNames(new Set());
    else setSelectedNames(new Set(displayedStudents.map((s) => s.name)));
  };

  const allPupils = useMemo(
    () => [...new Set(checks.map((c) => c.pupil_name).filter(Boolean) as string[])].sort(),
    [checks],
  );

  const hasAnyStudents = checks.some((c) => c.pupil_name?.trim());

  const hasActiveFilters =
    search.trim() !== '' ||
    filterGroup !== 'all' ||
    filterFolder !== 'all' ||
    pctFilter !== 'all';

  if (loading)
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Загрузка...
      </div>
    );

  if (!hasAnyStudents)
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <User2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Нет данных об учениках</p>
        <p className="text-slate-400 text-sm mt-1">Укажите имя ученика при сохранении результата</p>
      </div>
    );

  return (
    <div className="space-y-4">
      {/* Groups manager */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => setShowGroupMgr((v) => !v)}
          className="cursor-pointer w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Users className="h-4 w-4 text-indigo-500" />
            Группы
            {groups.length > 0 && (
              <span className="text-xs text-slate-400 font-normal">({groups.length})</span>
            )}
          </div>
          {showGroupMgr ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
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

      {/* Search + sort */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени ученика..."
            className="cursor-text w-full pl-9 pr-8 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="cursor-pointer text-sm border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-slate-600 focus:outline-none focus:border-indigo-400"
        >
          <option value="works_desc">По кол-ву работ</option>
          <option value="pct_desc">По % убыванию</option>
          <option value="pct_asc">По % возрастанию</option>
          <option value="name_asc">По имени А–Я</option>
          <option value="date_desc">По дате</option>
        </select>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Performance quick filter */}
        <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5">
          {([
            ['all', 'Все'],
            ['low', '< 50%'],
            ['mid', '50–80%'],
            ['high', '≥ 80%'],
          ] as [PctFilter, string][]).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPctFilter(val)}
              className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${pctFilter === val ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Group filter */}
        {groups.length > 0 && (
          <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 gap-0.5 flex-wrap">
            <button
              onClick={() => setFilterGroup('all')}
              className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${filterGroup === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Все группы
            </button>
            <button
              onClick={() => setFilterGroup('')}
              className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${filterGroup === '' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Без группы
            </button>
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => setFilterGroup(g.id)}
                className={`cursor-pointer text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${filterGroup === g.id ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {g.name}
              </button>
            ))}
          </div>
        )}

        {/* Folder filter */}
        {folders.length > 0 && (
          <select
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="cursor-pointer text-sm border border-slate-200 bg-white rounded-xl pl-3 pr-8 py-2 text-slate-600 focus:outline-none focus:border-indigo-400"
          >
            <option value="all">Все папки</option>
            <option value="">Без папки</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="cursor-pointer text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{displayedStudents.length}</p>
          <p className="text-xs text-slate-400 mt-0.5">Учеников</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-800">
            {displayedStudents.reduce((s, st) => s + st.checks.length, 0)}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Работ всего</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3 text-center">
          <p className={`text-2xl font-bold ${scoreColor(overallAvg)}`}>{overallAvg}%</p>
          <p className="text-xs text-slate-400 mt-0.5">Средний процент</p>
        </div>
      </div>

      {/* Select all toggle */}
      {displayedStudents.length > 0 && (
        <div className="flex items-center justify-between min-h-[1.25rem]">
          {displayedStudents.length !== students.length && (
            <p className="text-xs text-slate-400">
              Показано {displayedStudents.length} из {students.length}
            </p>
          )}
          <button
            onClick={toggleAll}
            className="cursor-pointer text-xs text-indigo-600 hover:text-indigo-800 ml-auto transition-colors"
          >
            {isAllSelected ? 'Снять выделение' : 'Выбрать всех'}
          </button>
        </div>
      )}

      {/* Student list */}
      <div className="space-y-3">
        {displayedStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-slate-400 font-medium mb-2">Ничего не найдено</p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Сбросить фильтры
              </button>
            )}
          </div>
        ) : (
          displayedStudents.map((student) => {
            const groupId = pupilGroups.get(student.name);
            const groupName = groupId ? groups.find((g) => g.id === groupId)?.name : null;
            const isExpanded = expandedName === student.name;

            return (
              <div
                key={student.name}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div className="flex items-center">
                  {/* Checkbox */}
                  <div className="pl-4 py-4 shrink-0">
                    <input
                      type="checkbox"
                      checked={selectedNames.has(student.name)}
                      onChange={() => toggleSelect(student.name)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 accent-indigo-600 cursor-pointer"
                    />
                  </div>

                  {/* Main row */}
                  <button
                    onClick={() =>
                      setExpandedName(isExpanded ? null : student.name)
                    }
                    className="cursor-pointer flex-1 flex items-center gap-4 px-4 py-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                      <User2 className="h-5 w-5 text-indigo-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                        <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                        <span className={`text-sm font-bold tabular-nums ${scoreColor(student.avgPct)}`}>
                          {student.avgScore.toFixed(1)}
                        </span>
                        <span className="text-xs text-slate-400">ср. балл</span>
                        {groupName && (
                          <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Users className="h-2.5 w-2.5" />
                            {groupName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
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
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-300" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-300" />
                      )}
                    </div>
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {/* Inline group selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide shrink-0">
                        Группа
                      </span>
                      <select
                        value={groupId || ''}
                        onChange={(e) => handleAssignGroup(student.name, e.target.value)}
                        className="cursor-pointer flex-1 max-w-xs pl-3 pr-8 py-1.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="">Без группы</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Works list */}
                    <div>
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                        Работы
                      </p>
                      {student.checks.map((c) => (
                        <CheckMini key={c.id} check={c} folders={folders} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bulk action bar */}
      {selectedNames.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 whitespace-nowrap">
          <span className="text-sm font-medium text-slate-200">{selectedNames.size} выбрано</span>
          <div className="w-px h-4 bg-slate-700" />
          <button
            onClick={() => setSelectedNames(new Set())}
            className="cursor-pointer text-xs text-slate-400 hover:text-white transition-colors"
          >
            Снять
          </button>
          {groups.length > 0 && (
            <>
              <div className="w-px h-4 bg-slate-700" />
              <select
                value={bulkGroupId}
                onChange={(e) => setBulkGroupId(e.target.value)}
                className="cursor-pointer text-xs bg-slate-800 border border-slate-700 text-slate-300 rounded-lg pl-2 pr-6 py-1.5 focus:outline-none"
              >
                <option value="">Группа...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleBulkAssignGroup}
                disabled={!bulkGroupId}
                className="cursor-pointer text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-default px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                В группу
              </button>
              <button
                onClick={handleBulkRemoveFromGroup}
                className="cursor-pointer text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Убрать из группы
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
