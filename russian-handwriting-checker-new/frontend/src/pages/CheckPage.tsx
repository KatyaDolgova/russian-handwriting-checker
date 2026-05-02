import { useState, useEffect } from 'react';
import { FileCheck } from 'lucide-react';
import UploadForm from '../components/UploadForm';
import TextEditor from '../components/TextEditor';
import CheckPanel from '../components/CheckPanel';
import ResultPanel from '../components/ResultPanel';
import StreamingPreview from '../components/StreamingPreview';
import type { CheckState } from '../App';

interface CheckPageProps {
  state: CheckState;
  setState: React.Dispatch<React.SetStateAction<CheckState>>;
}

export default function CheckPage({ state, setState }: CheckPageProps) {
  const [streamText, setStreamText] = useState('');
  const { editedText, result, filename, functionId, rightState } = state;

  // Если пользователь ушёл во время стриминга — сбрасываем состояние
  useEffect(() => {
    if (rightState === 'streaming') {
      setState(prev => ({ ...prev, rightState: 'empty' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadSuccess = (data: Record<string, unknown>) => {
    setStreamText('');
    setState(prev => ({
      ...prev,
      editedText: (data.text as string) || '',
      filename: (data.filename as string) || 'uploaded-file',
      result: null,
      rightState: 'empty',
    }));
  };

  const handleStreamStart = () => {
    setStreamText('');
    setState(prev => ({ ...prev, result: null, rightState: 'streaming' }));
  };

  const handleStreamCancel = () => {
    setStreamText('');
    setState(prev => ({ ...prev, rightState: 'empty' }));
  };

  const handleStreamChunk = (chunk: string) => {
    setStreamText(prev => prev + chunk);
  };

  const handleCheckComplete = (res: Record<string, unknown>, fnId: string) => {
    setState(prev => ({ ...prev, result: res, functionId: fnId, rightState: 'result' }));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="flex flex-col gap-5">
        <UploadForm onSuccess={handleUploadSuccess} />
        <TextEditor
          value={editedText}
          onChange={(v) => setState(prev => ({ ...prev, editedText: v }))}
          filename={filename}
        />
        <CheckPanel
          text={editedText}
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
}

function EmptyResult() {
  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <FileCheck className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-slate-500 font-medium">Результат появится здесь</p>
      <p className="text-slate-400 text-sm mt-1">Введите текст и нажмите «Проверить»</p>
    </div>
  );
}
