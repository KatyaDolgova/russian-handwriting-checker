import { useState, useEffect } from 'react';
import type { CheckState } from '@/App';
import { EmptyResult, StreamingPreview, TextEditor, UploadForm } from '@/components/ui';
import { CheckPanel, ResultPanel } from '@/components/panels';

interface CheckPageProps {
  state: CheckState;
  setState: React.Dispatch<React.SetStateAction<CheckState>>;
}

export const CheckPage = ({ state, setState }: CheckPageProps) => {
  const [streamText, setStreamText] = useState('');
  const { editedText, result, filename, functionId, rightState } = state;

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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="flex flex-col gap-5">
        <UploadForm onSuccess={handleUploadSuccess} />
        <TextEditor
          value={editedText}
          onChange={(v) => setState((prev) => ({ ...prev, editedText: v }))}
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
};
