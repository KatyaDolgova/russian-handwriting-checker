import { useState } from 'react';
import { FileCheck } from 'lucide-react';
import UploadForm from '../components/UploadForm';
import TextEditor from '../components/TextEditor';
import CheckPanel from '../components/CheckPanel';
import ResultPanel from '../components/ResultPanel';
import StreamingPreview from '../components/StreamingPreview';

type RightState = 'empty' | 'streaming' | 'result';

export default function CheckPage() {
  const [editedText, setEditedText] = useState('');
  const [result, setResult] = useState<any>(null);
  const [filename, setFilename] = useState('');
  const [functionId, setFunctionId] = useState('');
  const [streamText, setStreamText] = useState('');
  const [rightState, setRightState] = useState<RightState>('empty');

  const handleUploadSuccess = (data: any) => {
    setEditedText(data.text || '');
    setFilename(data.filename || 'uploaded-file');
    setResult(null);
    setRightState('empty');
  };

  const handleStreamStart = () => {
    setStreamText('');
    setResult(null);
    setRightState('streaming');
  };

  const handleStreamCancel = () => {
    setStreamText('');
    setRightState('empty');
  };

  const handleStreamChunk = (chunk: string) => {
    setStreamText((prev) => prev + chunk);
  };

  const handleCheckComplete = (res: any, fnId: string) => {
    setResult(res);
    setFunctionId(fnId);
    setRightState('result');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="flex flex-col gap-5">
        <UploadForm onSuccess={handleUploadSuccess} />
        <TextEditor value={editedText} onChange={setEditedText} filename={filename} />
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
