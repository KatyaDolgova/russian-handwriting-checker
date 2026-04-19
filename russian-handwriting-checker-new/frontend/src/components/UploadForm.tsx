import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import axios from 'axios';

interface UploadFormProps {
  onSuccess: (data: any) => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('http://127.0.0.1:8000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onSuccess(res.data);
    } catch (err) {
      alert('Ошибка загрузки файла');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0]); }}
    >
      <Upload className="mx-auto h-14 w-14 text-gray-400 mb-4" />
      <p className="text-xl font-semibold text-gray-700">Загрузите работу ученика</p>
      <p className="text-gray-500 mt-2">Поддерживаются: JPG, PNG, PDF, DOCX и другие</p>

      <label className="mt-8 inline-flex items-center gap-3 bg-white px-8 py-4 rounded-2xl border border-gray-300 hover:bg-gray-50 cursor-pointer shadow-sm">
        <FileText className="h-5 w-5" />
        <span className="font-medium">Выбрать файл</span>
        <input
          type="file"
          className="hidden"
          accept=".jpg,.jpeg,.png,.pdf,.docx,.doc"
          onChange={(e) => e.target.files && handleUpload(e.target.files[0])}
        />
      </label>

      {isLoading && <p className="text-blue-600 mt-6">Обрабатываем файл...</p>}
    </div>
  );
}