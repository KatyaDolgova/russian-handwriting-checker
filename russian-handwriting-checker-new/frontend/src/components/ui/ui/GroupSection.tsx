import type { Group } from '@/types';
import { Users, X, Pencil, Trash2, AlertCircle, Plus } from 'lucide-react';
import { useState } from 'react';

interface GroupSectionProps {
  groups: Group[];
  pupils: string[];
  pupilGroups: Map<string, string>;
  onAddGroup: (name: string) => Promise<void>;
  onUpdateGroup: (id: string, name: string) => Promise<void>;
  onDeleteGroup: (id: string) => Promise<void>;
  onAssignGroup: (pupilName: string, groupId: string) => Promise<void>;
}

export const GroupSection = ({
  groups,
  pupils,
  pupilGroups,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
  onAssignGroup,
}: GroupSectionProps) => {
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
        {groups.map((g) => (
          <div key={g.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-400 shrink-0" />
              {editingId === g.id ? (
                <>
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') doUpdate(g.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="cursor-text flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none"
                  />
                  <button
                    onClick={() => doUpdate(g.id)}
                    className="cursor-pointer text-xs px-2 py-1 bg-indigo-600 text-white rounded-lg"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="cursor-pointer p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm text-slate-700">{g.name}</span>
                  <span className="text-xs text-slate-400">
                    {[...pupilGroups.entries()].filter(([, gid]) => gid === g.id).length} уч.
                  </span>
                  <button
                    onClick={() => {
                      setEditingId(g.id);
                      setEditName(g.name);
                    }}
                    className="cursor-pointer p-1 text-slate-300 hover:text-indigo-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
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
                <span className="text-sm text-red-700 flex-1">
                  Удалить группу? Ученики останутся без группы.
                </span>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    onDeleteGroup(g.id);
                    setConfirmDeleteId(null);
                  }}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') doAdd();
            }}
            placeholder="Название группы..."
            className="cursor-text flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400"
          />
          <button
            onClick={doAdd}
            disabled={busy || !newName.trim()}
            className="cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-xl disabled:opacity-40 disabled:cursor-default transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Создать
          </button>
        </div>
      </div>

      {pupils.length > 0 && groups.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Назначение учеников
          </p>
          {pupils.map((pupil) => (
            <div key={pupil} className="flex items-center gap-3">
              <span className="flex-1 text-sm text-slate-700 truncate">{pupil}</span>
              <select
                value={pupilGroups.get(pupil) || ''}
                onChange={(e) => onAssignGroup(pupil, e.target.value)}
                className="cursor-pointer text-xs border border-slate-200 bg-white rounded-lg pl-2 pr-6 py-1.5 text-slate-600 focus:outline-none focus:border-indigo-400 max-w-[160px]"
              >
                <option value="">Без группы</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
