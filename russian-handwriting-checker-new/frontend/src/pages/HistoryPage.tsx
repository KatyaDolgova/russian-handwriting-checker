import { LogIn, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import HistoryPanel from '../components/HistoryPanel';

export default function HistoryPage() {
  const { user } = useAuth();

  if (!user) return <EmptyAuth />;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-800 mb-5">История проверок</h2>
      <HistoryPanel />
    </div>
  );
}

function EmptyAuth() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <User className="h-7 w-7 text-slate-400" />
      </div>
      <p className="text-slate-600 font-medium mb-1">Войдите, чтобы видеть историю</p>
      <p className="text-slate-400 text-sm mb-5">История сохраняется только для авторизованных пользователей</p>
      <a
        href="/"
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
      >
        <LogIn className="h-4 w-4" />На главную
      </a>
    </div>
  );
}
