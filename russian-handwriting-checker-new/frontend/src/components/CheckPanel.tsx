import { useEffect, useRef, useState } from 'react';
import { Sparkles, Loader2, ChevronRight, X } from 'lucide-react';
import api from '../api';
import { useToast } from './Toast';

interface CheckPanelProps {
  text: string;
  onCheckComplete: (result: Record<string, unknown>, functionId: string) => void;
  onStreamChunk: (chunk: string) => void;
  onStreamStart: () => void;
  onStreamCancel?: () => void;
}

interface Fn {
  id: string;
  name: string;
  description: string;
  user_template?: string;
}

const PALETTE = [
  'bg-violet-50 border-violet-200 text-violet-700 data-[active=true]:bg-violet-600 data-[active=true]:text-white data-[active=true]:border-violet-600 hover:bg-violet-100',
  'bg-blue-50 border-blue-200 text-blue-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600 hover:bg-blue-100',
  'bg-emerald-50 border-emerald-200 text-emerald-700 data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600 hover:bg-emerald-100',
  'bg-amber-50 border-amber-200 text-amber-700 data-[active=true]:bg-amber-600 data-[active=true]:text-white data-[active=true]:border-amber-600 hover:bg-amber-100',
  'bg-rose-50 border-rose-200 text-rose-700 data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:border-rose-600 hover:bg-rose-100',
  'bg-slate-50 border-slate-200 text-slate-600 data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:border-slate-700 hover:bg-slate-100',
];

export default function CheckPanel({ text, onCheckComplete, onStreamChunk, onStreamStart, onStreamCancel }: CheckPanelProps) {
  const [functions, setFunctions] = useState<Fn[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    api.get('/api/functions/').then((res) => {
      setFunctions(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);
    });
  }, []);

  const toast = useToast();
  const selectedFn = functions.find((f) => f.id === selectedId);

  const handleCancel = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    onStreamCancel?.();
  };

  const handleCheck = async () => {
    const tmpl = selectedFn?.user_template ?? '';
    if (tmpl.includes('{text}') && !text.trim()) { toast.info('Введите текст для проверки'); return; }
    if (!selectedId) return;

    setIsLoading(true);
    onStreamStart();

    const controller = new AbortController();
    abortRef.current = controller;

    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch('http://127.0.0.1:8000/api/check/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify({ text, function_id: selectedId }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'chunk') {
              onStreamChunk(event.text);
            } else if (event.type === 'done') {
              onCheckComplete(event.result, selectedId);
            } else if (event.type === 'error') {
              toast.error('Ошибка проверки: ' + event.message);
            }
          } catch {
            // skip malformed SSE line
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      toast.error('Ошибка соединения с сервером');
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
          functions.map((fn, idx) => (
            <button
              key={fn.id}
              data-active={selectedId === fn.id}
              onClick={() => setSelectedId(fn.id)}
              title={fn.description}
              className={`cursor-pointer py-3 px-4 rounded-xl text-sm font-medium border transition-all text-left leading-tight ${PALETTE[idx % PALETTE.length]}`}
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

      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={handleCheck}
          disabled={isLoading || !selectedId}
          className="cursor-pointer flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3.5 rounded-xl font-semibold text-sm transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Анализируем...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 ml-3" />
              Проверить текст
              <ChevronRight className="h-4 w-4 ml-auto mr-3" />
            </>
          )}
        </button>
        {isLoading && (
          <button
            onClick={handleCancel}
            title="Отменить"
            className="flex items-center justify-center w-12 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 rounded-xl transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
