import { useState } from 'react';
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '@/api';
import { POLL_INTERVAL, POLL_TIMEOUT } from '@/constants';

interface UploadFormProps {
  onSuccess: (data: any) => void;
}

export const UploadForm = ({ onSuccess }: UploadFormProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'processing' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpload = async (file: File) => {
    setStatus('uploading');
    setErrorMsg('');

    const formData = new FormData();
    formData.append('file', file);

    let taskId: string;
    try {
      const res = await api.post('/api/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      taskId = res.data.task_id;
    } catch {
      setStatus('error');
      setErrorMsg('Не удалось загрузить файл');
      return;
    }

    setStatus('processing');
    const deadline = Date.now() + POLL_TIMEOUT;

    const poll = async () => {
      if (Date.now() > deadline) {
        setStatus('error');
        setErrorMsg('Превышено время ожидания OCR');
        return;
      }
      try {
        const res = await api.get(`/api/upload/${taskId}`);
        const { status: s, text, error } = res.data;
        if (s === 'done') {
          setStatus('idle');
          onSuccess({ text, filename: file.name });
        } else if (s === 'error') {
          setStatus('error');
          setErrorMsg(error || 'Ошибка распознавания');
        } else {
          setTimeout(poll, POLL_INTERVAL);
        }
      } catch {
        setTimeout(poll, POLL_INTERVAL);
      }
    };

    setTimeout(poll, POLL_INTERVAL);
  };

  const busy = status === 'uploading' || status === 'processing';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Загрузка работы
        </h2>
      </div>

      <label
        className={`block p-8 text-center transition-colors cursor-pointer ${
          busy ? 'pointer-events-none' : ''
        } ${isDragging ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!busy && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.docx,.doc"
          disabled={busy}
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />

        <div
          className={`w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
            isDragging ? 'bg-indigo-100' : 'bg-slate-100'
          }`}
        >
          {busy ? (
            <Loader2 className={`h-7 w-7 text-indigo-500 animate-spin`} />
          ) : (
            <UploadCloud
              className={`h-7 w-7 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`}
            />
          )}
        </div>

        {!busy ? (
          <>
            <p className="text-slate-700 font-medium mb-1">
              {isDragging ? 'Отпустите файл' : 'Перетащите файл или нажмите'}
            </p>
            <p className="text-slate-400 text-sm">JPG, PNG, PDF, DOCX — до 50 МБ</p>
          </>
        ) : (
          <div>
            <p className="text-indigo-600 font-medium mb-1">
              {status === 'uploading' ? 'Загружаем файл...' : 'Распознаём текст...'}
            </p>
            <p className="text-slate-400 text-sm">
              {status === 'processing' ? 'Это может занять до минуты' : 'Пожалуйста, подождите'}
            </p>
          </div>
        )}
      </label>

      {status === 'error' && (
        <div className="mx-5 mb-4 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {!busy && (
        <div className="px-5 pb-5">
          <label className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium text-sm cursor-pointer transition-colors">
            <FileText className="h-4 w-4" />
            Выбрать файл
            <input
              type="file"
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf,.docx,.doc"
              onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
            />
          </label>
        </div>
      )}
    </div>
  );
};
