import { useEffect, useState } from 'react';
import { Sparkles, Loader2, ChevronRight } from 'lucide-react';
import api from '../api';

interface CheckPanelProps {
  text: string;
  onCheckComplete: (result: any, functionId: string) => void;
}

interface Fn {
  id: string;
  name: string;
  description: string;
}

const TYPE_COLORS: Record<string, string> = {
  grammar:      'bg-violet-50 border-violet-200 text-violet-700 data-[active=true]:bg-violet-600 data-[active=true]:text-white data-[active=true]:border-violet-600',
  oge_essay:    'bg-blue-50 border-blue-200 text-blue-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600',
  ege_essay:    'bg-emerald-50 border-emerald-200 text-emerald-700 data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600',
  final_essay:  'bg-amber-50 border-amber-200 text-amber-700 data-[active=true]:bg-amber-600 data-[active=true]:text-white data-[active=true]:border-amber-600',
  free:         'bg-slate-50 border-slate-200 text-slate-600 data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:border-slate-700',
};

function getTypeColor(name: string): string {
  const key = Object.keys(TYPE_COLORS).find((k) => name.toLowerCase().includes(k));
  return key ? TYPE_COLORS[key] : TYPE_COLORS.free;
}

export default function CheckPanel({ text, onCheckComplete }: CheckPanelProps) {
  const [functions, setFunctions] = useState<Fn[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.get('/api/functions/').then((res) => {
      setFunctions(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);
    });
  }, []);

  const selectedFn = functions.find((f) => f.id === selectedId);

  const handleCheck = async () => {
    if (!text.trim()) { alert('Текст пустой'); return; }
    if (!selectedId) return;
    setIsLoading(true);
    try {
      const res = await api.post('/api/check/', { text, function_id: selectedId });
      onCheckComplete(res.data, selectedId);
    } catch (err) {
      alert('Ошибка при проверке');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Тип проверки</h2>
      </div>

      <div className="p-4 grid grid-cols-2 gap-2">
        {functions.length === 0 ? (
          [1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
          ))
        ) : (
          functions.map((fn) => (
            <button
              key={fn.id}
              data-active={selectedId === fn.id}
              onClick={() => setSelectedId(fn.id)}
              title={fn.description}
              className={`py-3 px-4 rounded-xl text-sm font-medium border transition-all text-left leading-tight ${getTypeColor(fn.name)}`}
            >
              {fn.name}
            </button>
          ))
        )}
      </div>

      {selectedFn && (
        <div className="mx-4 mb-4 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 leading-relaxed">
          {selectedFn.description}
        </div>
      )}

      <div className="px-4 pb-4">
        <button
          onClick={handleCheck}
          disabled={isLoading || !selectedId}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Проверяем...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Проверить текст
              <ChevronRight className="h-4 w-4 ml-auto" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
