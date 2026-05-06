import { ConfirmDelete } from '@/components/ui/ui/ConfirmDelete';
import type { Folder } from '@/types';
import { FolderClosed, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface FolderSectionProps {
  folders: Folder[];
  onAdd: (name: string) => Promise<void>;
  onUpdate: (id: string, name: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const FolderSection = ({ folders, onAdd, onUpdate, onDelete }: FolderSectionProps) => {
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
      {folders.map((f) => (
        <div key={f.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <FolderClosed className="h-4 w-4 text-amber-500 shrink-0" />
            {editingId === f.id ? (
              <>
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') doUpdate(f.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="cursor-text flex-1 px-2 py-1 text-sm border border-indigo-300 rounded-lg focus:outline-none"
                />
                <button
                  onClick={() => doUpdate(f.id)}
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
                <span className="flex-1 text-sm text-slate-700">{f.name}</span>
                <button
                  onClick={() => {
                    setEditingId(f.id);
                    setEditName(f.name);
                  }}
                  className="cursor-pointer p-1 text-slate-300 hover:text-indigo-600"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(f.id)}
                  className="cursor-pointer p-1 text-slate-300 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
          {confirmDeleteId === f.id && (
            <div className="ml-6">
              <ConfirmDelete
                onConfirm={async () => {
                  await onDelete(f.id);
                  setConfirmDeleteId(null);
                }}
                onCancel={() => setConfirmDeleteId(null)}
              />
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
          placeholder="Название папки..."
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
  );
};
