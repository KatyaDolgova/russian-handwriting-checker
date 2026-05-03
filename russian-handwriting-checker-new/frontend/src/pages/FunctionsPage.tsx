import { useState } from 'react';
import { BookOpen, Layers } from 'lucide-react';
import FunctionManager from '../components/FunctionManager';
import FunctionGallery from '../components/FunctionGallery';

type Tab = 'mine' | 'gallery';

export default function FunctionsPage() {
  const [tab, setTab] = useState<Tab>('mine');

  return (
    <div className="max-w-4xl">
      {/* Заголовок */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-800">Функции проверки</h2>
        <p className="text-sm text-slate-400 mt-1">
          Управляйте промптами, которые ИИ использует для проверки работ
        </p>
      </div>

      {/* Вкладки */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('mine')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'mine'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-4 w-4" />
          Мои функции
        </button>
        <button
          onClick={() => setTab('gallery')}
          className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'gallery'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Галерея
        </button>
      </div>

      {/* Содержимое вкладки */}
      {tab === 'mine' ? <FunctionManager /> : <FunctionGallery />}
    </div>
  );
}
