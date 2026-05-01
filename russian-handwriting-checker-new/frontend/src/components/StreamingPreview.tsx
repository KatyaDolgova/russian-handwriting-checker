import { useEffect, useRef } from 'react';
import { Bot, Loader2 } from 'lucide-react';

interface StreamingPreviewProps {
  text: string;
}

export default function StreamingPreview({ text }: StreamingPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [text]);

  return (
    <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden flex flex-col min-h-[400px]">
      <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-800">ИИ анализирует текст...</p>
          <p className="text-xs text-indigo-500">Это может занять 1–2 минуты</p>
        </div>
        <Loader2 className="h-4 w-4 text-indigo-500 animate-spin ml-auto" />
      </div>

      <div ref={containerRef} className="p-5 flex-1 overflow-y-auto">
        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
          {text}
          <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse ml-0.5 align-middle" />
        </pre>
      </div>

      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-1 flex-1 bg-indigo-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
