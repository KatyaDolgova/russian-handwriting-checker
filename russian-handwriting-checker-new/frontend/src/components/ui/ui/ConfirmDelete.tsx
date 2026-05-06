import { AlertCircle } from 'lucide-react';

export const ConfirmDelete = ({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) => {
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
};
