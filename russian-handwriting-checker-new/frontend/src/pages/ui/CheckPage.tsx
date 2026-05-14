import { useState, useEffect } from 'react';
import type { CheckState } from '@/App';
import { EmptyResult, StreamingPreview, TextEditor, UploadForm } from '@/components/ui';
import { CheckPanel, ResultPanel } from '@/components/panels';
import { BookOpen, X } from 'lucide-react';

interface CheckPageProps {
  state: CheckState;
  setState: React.Dispatch<React.SetStateAction<CheckState>>;
}

export const CheckPage = ({ state, setState }: CheckPageProps) => {
  const [streamText, setStreamText] = useState('');
  const [showSource, setShowSource] = useState(false);
  const { editedText, sourceText, result, filename, functionId, rightState } = state;

  useEffect(() => {
    if (rightState === 'streaming') {
      setState((prev) => ({ ...prev, rightState: 'empty' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadSuccess = (data: Record<string, unknown>) => {
    setStreamText('');
    setState((prev) => ({
      ...prev,
      editedText: (data.text as string) || '',
      filename: (data.filename as string) || 'uploaded-file',
      result: null,
      rightState: 'empty',
    }));
  };

  const handleStreamStart = () => {
    setStreamText('');
    setState((prev) => ({ ...prev, result: null, rightState: 'streaming' }));
  };

  const handleStreamCancel = () => {
    setStreamText('');
    setState((prev) => ({ ...prev, rightState: 'empty' }));
  };

  const handleStreamChunk = (chunk: string) => {
    setStreamText((prev) => prev + chunk);
  };

  const handleCheckComplete = (res: Record<string, unknown>, fnId: string) => {
    setState((prev) => ({ ...prev, result: res, functionId: fnId, rightState: 'result' }));
  };

  const handleClearSource = () => {
    setState((prev) => ({ ...prev, sourceText: '' }));
    setShowSource(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="flex flex-col gap-5">
        <UploadForm onSuccess={handleUploadSuccess} />

        {/* Исходный текст — необязательное поле */}
        {showSource ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Исходный текст
                </h2>
                <span className="text-xs text-slate-400 font-normal normal-case">(необязательно)</span>
              </div>
              <button
                onClick={handleClearSource}
                title="Убрать поле"
                className="cursor-pointer p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={sourceText}
              onChange={(e) => setState((prev) => ({ ...prev, sourceText: e.target.value }))}
              placeholder="Вставьте исходный текст, задание или эталонный вариант..."
              rows={6}
              className="cursor-text w-full px-5 py-4 text-sm text-slate-700 resize-none focus:outline-none placeholder:text-slate-300"
            />
            <div className="px-5 pb-3">
              <p className="text-xs text-slate-400">
                Используется для проверки изложений, сочинений и сравнения с эталоном
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSource(true)}
            className="cursor-pointer flex items-center gap-2 text-sm text-slate-400 hover:text-indigo-600 transition-colors self-start px-1"
          >
            <BookOpen className="h-4 w-4" />
            + Добавить исходный текст
          </button>
        )}

        <TextEditor
          value={editedText}
          onChange={(v) => setState((prev) => ({ ...prev, editedText: v }))}
          filename={filename}
        />
        <CheckPanel
          text={editedText}
          sourceText={sourceText}
          onCheckComplete={handleCheckComplete}
          onStreamChunk={handleStreamChunk}
          onStreamStart={handleStreamStart}
          onStreamCancel={handleStreamCancel}
        />
      </div>

      <div>
        {rightState === 'streaming' && <StreamingPreview text={streamText} />}
        {rightState === 'result' && result && (
          <ResultPanel
            result={result}
            originalText={editedText}
            filename={filename}
            functionId={functionId}
          />
        )}
        {rightState === 'empty' && <EmptyResult />}
      </div>
    </div>
  );
};
