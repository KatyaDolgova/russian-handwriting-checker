import { useState, useCallback } from 'react';
import {
  Globe,
  Copy,
  ChevronUp,
  ChevronDown,
  Pencil,
  EyeOff,
  Trash2,
  AlertCircle,
  Loader2,
  Lock,
  History,
} from 'lucide-react';
import api from '@/api';
import { FunctionForm } from '@/components/ui/ui/FunctionForm';
import { VersionRow } from '@/components/ui/ui/VersionRow';
import type { Fn, FnVersion } from '@/types';

interface FunctionCardProps {
  fn: Fn;
  isExpanded: boolean;
  isEditing: boolean;
  isOwn: boolean;
  confirmDeleteId: string | null;
  confirmUnpublishId: string | null;
  onToggleExpand: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (data: Omit<Fn, 'id'>) => Promise<void>;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onTogglePublish: () => void;
  onConfirmUnpublish: () => void;
  onCancelUnpublish: () => void;
}
export const FunctionCard = ({
  fn,
  isExpanded,
  isEditing,
  isOwn,
  confirmDeleteId,
  confirmUnpublishId,
  onToggleExpand,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onTogglePublish,
  onConfirmUnpublish,
  onCancelUnpublish,
}: FunctionCardProps) => {
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<FnVersion[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);

  const loadVersions = useCallback(async () => {
    if (versions.length > 0) return;
    setVersionsLoading(true);
    try {
      const r = await api.get(`/api/functions/${fn.id}/versions`);
      setVersions(r.data);
    } finally {
      setVersionsLoading(false);
    }
  }, [fn.id, versions.length]);

  const handleToggleVersions = () => {
    if (!showVersions) loadVersions();
    setShowVersions((v) => !v);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {isEditing ? (
        <div className="p-4">
          <FunctionForm
            initial={{
              name: fn.name,
              description: fn.description,
              system_prompt: fn.system_prompt,
              user_template: fn.user_template,
            }}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={onToggleExpand}
              className="flex-1 flex items-center gap-3 text-left min-w-0"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-slate-800 text-sm">{fn.name}</p>
                  {fn.is_default && (
                    <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                      <Lock className="h-2.5 w-2.5" />
                      стандартная
                    </span>
                  )}
                  {isOwn && fn.is_published && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                      <Globe className="h-2.5 w-2.5" />
                      опубликована
                    </span>
                  )}
                  {isOwn && !fn.is_published && !fn.is_default && (
                    <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                      черновик
                    </span>
                  )}
                  {fn.original_function_id && (
                    <span className="flex items-center gap-1 text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                      <Copy className="h-2.5 w-2.5" />
                      скопировано
                    </span>
                  )}
                </div>
                {fn.description && (
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{fn.description}</p>
                )}
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
              )}
            </button>

            {isOwn && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={onEdit}
                  className="cursor-pointer p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  title="Редактировать"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={fn.is_published ? onTogglePublish : onTogglePublish}
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    fn.is_published
                      ? 'text-emerald-600 hover:bg-red-50 hover:text-red-500'
                      : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                  title={fn.is_published ? 'Снять с публикации' : 'Опубликовать в галерею'}
                >
                  {fn.is_published ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={onConfirmDelete}
                  className={`cursor-pointer p-2 rounded-lg transition-colors ${
                    confirmDeleteId === fn.id
                      ? 'text-red-500 bg-red-50'
                      : 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                  }`}
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {confirmUnpublishId === fn.id && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="text-sm text-amber-700 flex-1">
                  Снять «{fn.name}» с публикации? Функция пропадёт из галереи.
                </span>
                <button
                  onClick={onCancelUnpublish}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={onConfirmUnpublish}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                >
                  Снять
                </button>
              </div>
            </div>
          )}

          {confirmDeleteId === fn.id && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-sm text-red-700 flex-1">Удалить «{fn.name}»?</span>
                <button
                  onClick={onCancelDelete}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={onDelete}
                  className="cursor-pointer text-xs px-2.5 py-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
                >
                  Удалить
                </button>
              </div>
            </div>
          )}

          {isExpanded && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                  Системный промпт
                </p>
                <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap font-mono leading-relaxed">
                  {fn.system_prompt}
                </pre>
              </div>
              {fn.user_template ? (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">
                    Шаблон
                  </p>
                  <pre className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 font-mono">
                    {fn.user_template}
                  </pre>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Шаблон не задан — функция принимает произвольный текст
                </p>
              )}

              {isOwn && fn.is_published && (
                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleToggleVersions}
                    className="cursor-pointer flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-colors py-1"
                  >
                    {versionsLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <History className="h-3.5 w-3.5" />
                    )}
                    {showVersions ? 'Скрыть историю версий' : 'История версий'}
                    {!showVersions && versions.length > 0 && (
                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                        {versions.length}
                      </span>
                    )}
                  </button>

                  {showVersions && (
                    <div className="mt-2 space-y-1.5">
                      {versions.length === 0 && !versionsLoading && (
                        <p className="text-xs text-slate-400 italic pl-1">Версии не найдены</p>
                      )}
                      {versions.map((ver, idx) => (
                        <VersionRow key={ver.id} ver={ver} isLatest={idx === 0} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
