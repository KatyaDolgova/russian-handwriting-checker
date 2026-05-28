import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout, ToastProvider } from '@/components/ui';
import { CheckPage, FunctionsPage, HistoryPage, ProfilePage, StudentsPage, NotFoundPage } from '@/pages';
import api from '@/api';
import { POLL_INTERVAL, POLL_TIMEOUT } from '@/constants';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'error';

export interface CheckState {
  editedText: string;
  sourceText: string;
  streamText: string;
  result: Record<string, unknown> | null;
  filename: string;
  functionId: string;
  rightState: 'empty' | 'streaming' | 'result';
  uploadStatus: UploadStatus;
  uploadTaskId: string | null;
  uploadFilename: string;
  uploadError: string;
}

const INIT_CHECK: CheckState = {
  editedText: '',
  sourceText: '',
  streamText: '',
  result: null,
  filename: '',
  functionId: '',
  rightState: 'empty',
  uploadStatus: 'idle',
  uploadTaskId: null,
  uploadFilename: '',
  uploadError: '',
};

export default function App() {
  const [checkState, setCheckState] = useState<CheckState>(INIT_CHECK);

  // Polling статуса OCR живёт здесь, а не в UploadForm, поэтому продолжается
  // при переходах между страницами и не сбрасывает индикатор.
  useEffect(() => {
    if (checkState.uploadStatus !== 'processing' || !checkState.uploadTaskId) return;

    const taskId = checkState.uploadTaskId;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const deadline = Date.now() + POLL_TIMEOUT;

    const poll = async () => {
      if (cancelled) return;
      if (Date.now() > deadline) {
        setCheckState((prev) => ({
          ...prev,
          uploadStatus: 'error',
          uploadError: 'Превышено время ожидания OCR',
          uploadTaskId: null,
        }));
        return;
      }
      try {
        const res = await api.get(`/api/upload/${taskId}`);
        if (cancelled) return;
        const { status: s, text, error } = res.data;
        if (s === 'done') {
          setCheckState((prev) => ({
            ...prev,
            editedText: text || '',
            filename: prev.uploadFilename || 'uploaded-file',
            streamText: '',
            result: null,
            rightState: 'empty',
            uploadStatus: 'idle',
            uploadTaskId: null,
            uploadError: '',
          }));
        } else if (s === 'error') {
          setCheckState((prev) => ({
            ...prev,
            uploadStatus: 'error',
            uploadError: error || 'Ошибка распознавания',
            uploadTaskId: null,
          }));
        } else {
          timer = setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        if (!cancelled) timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    timer = setTimeout(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [checkState.uploadStatus, checkState.uploadTaskId]);

  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<CheckPage state={checkState} setState={setCheckState} />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/functions" element={<FunctionsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
