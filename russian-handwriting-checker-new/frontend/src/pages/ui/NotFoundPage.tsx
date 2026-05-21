import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';

export const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
      <FileQuestion className="h-8 w-8 text-indigo-400" />
    </div>
    <p className="text-4xl font-bold text-slate-800 mb-2">404</p>
    <p className="text-slate-600 font-medium mb-1">Страница не найдена</p>
    <p className="text-slate-400 text-sm mb-6">Такого адреса не существует</p>
    <Link
      to="/"
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
    >
      На главную
    </Link>
  </div>
);
