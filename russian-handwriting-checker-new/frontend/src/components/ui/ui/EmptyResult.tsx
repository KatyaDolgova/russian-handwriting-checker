import { FileCheck } from 'lucide-react';

export const EmptyResult = () => {
  return (
    <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <FileCheck className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-slate-500 font-medium">Результат появится здесь</p>
      <p className="text-slate-400 text-sm mt-1">Введите текст и нажмите «Проверить»</p>
    </div>
  );
};
