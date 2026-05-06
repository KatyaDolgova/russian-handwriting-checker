import { X } from 'lucide-react';
import type { Toast } from '@/types';
import { TOAST_STYLES } from '@/constants';

export const ToastItem = ({ toast, onClose }: { toast: Toast; onClose: () => void }) => {
  const s = TOAST_STYLES[toast.type];
  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${s.bg} ${s.border}`}
    >
      {s.icon}
      <p className="flex-1 text-sm text-slate-700 leading-snug">{toast.message}</p>
      <button
        onClick={onClose}
        className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
      s
    </div>
  );
};
