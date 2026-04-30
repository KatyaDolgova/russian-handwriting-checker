import { useState } from 'react';
import { X, LogIn, UserPlus, Loader2, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setInfo('');
    if (!email || !password) { setError('Заполните все поля'); return; }
    if (password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
        onClose();
      } else {
        const msg = await register(email, password);
        if (msg?.toLowerCase().includes('почт')) {
          setInfo(msg);
        } else {
          onClose();
        }
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-6 py-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-indigo-300 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-semibold">РусЯзык AI</span>
          </div>
          <p className="text-indigo-200 text-sm">
            {tab === 'login' ? 'Добро пожаловать обратно' : 'Создайте аккаунт учителя'}
          </p>
        </div>

        <div className="p-6">
          {/* Tab switcher */}
          <div className="flex mb-5 bg-slate-100 rounded-xl p-1">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setInfo(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="teacher@school.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Пароль</label>
              <input
                type="password"
                placeholder="Минимум 6 символов"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {info && (
            <div className="mt-3 text-sm text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : tab === 'login' ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {loading ? 'Загрузка...' : tab === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </div>
      </div>
    </div>
  );
}
