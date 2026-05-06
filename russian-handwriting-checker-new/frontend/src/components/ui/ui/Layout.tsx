import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogIn, LogOut, User, History, FileCheck, BookOpen, Settings, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/modals';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-lg tracking-tight">РусЯзык AI</span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" end className={navCls}>
              <FileCheck className="h-4 w-4" />
              Проверка
            </NavLink>
            {user && (
              <NavLink to="/history" className={navCls}>
                <History className="h-4 w-4" />
                История
              </NavLink>
            )}
            {user && (
              <NavLink to="/students" className={navCls}>
                <Users className="h-4 w-4" />
                Ученики
              </NavLink>
            )}
            <NavLink to="/functions" className={navCls}>
              <Settings className="h-4 w-4" />
              Функции
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `hidden sm:flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors ${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'text-slate-500 bg-slate-100 hover:bg-slate-200'
                    }`
                  }
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="max-w-[160px] truncate">{user.display_name || user.email}</span>
                </NavLink>
                <button
                  onClick={logout}
                  className="cursor-pointer flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Выйти</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Войти
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
};
