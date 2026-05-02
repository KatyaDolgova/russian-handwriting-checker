import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StudentsPanel from '../components/StudentsPanel';

export default function StudentsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <User className="h-7 w-7 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">Войдите, чтобы видеть статистику учеников</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-800 mb-5">Статистика учеников</h2>
      <StudentsPanel />
    </div>
  );
}
