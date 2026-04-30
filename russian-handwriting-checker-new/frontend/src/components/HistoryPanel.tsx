import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileText, User2, Loader2 } from 'lucide-react';
import api from '../api';

interface CheckRecord {
  id: string;
  filename: string;
  pupil_name?: string;
  score: number;
  comment: string;
  corrected_text: string;
  created_at: string;
}

function ScoreCircle({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
    score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' :
                  'text-red-600 bg-red-50 border-red-200';
  return (
    <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-bold text-base shrink-0 ${color}`}>
      {score}
    </div>
  );
}

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoryPanel() {
  const [checks, setChecks] = useState<CheckRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/check/history')
      .then((res) => setChecks(res.data))
      .catch(() => setChecks([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        Загружаем историю...
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
        <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">История пуста</p>
        <p className="text-slate-400 text-sm mt-1">Проверьте работу и сохраните результат</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {checks.map((check) => (
        <div key={check.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setExpandedId(expandedId === check.id ? null : check.id)}
            className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
          >
            <ScoreCircle score={check.score} />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {check.pupil_name && (
                  <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    <User2 className="h-3 w-3" />{check.pupil_name}
                  </span>
                )}
                <span className="text-xs text-slate-400 truncate">{check.filename}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1 line-clamp-1">{check.comment || '—'}</p>
              <p className="text-xs text-slate-300 mt-1">{formatDate(check.created_at)}</p>
            </div>

            {expandedId === check.id
              ? <ChevronUp className="h-4 w-4 text-slate-300 shrink-0" />
              : <ChevronDown className="h-4 w-4 text-slate-300 shrink-0" />
            }
          </button>

          {expandedId === check.id && (
            <div className="border-t border-slate-100 px-4 py-4 space-y-3">
              {check.comment && (
                <p className="text-sm text-slate-600 leading-relaxed">{check.comment}</p>
              )}
              {check.corrected_text && (
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed font-mono">
                  {check.corrected_text}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
