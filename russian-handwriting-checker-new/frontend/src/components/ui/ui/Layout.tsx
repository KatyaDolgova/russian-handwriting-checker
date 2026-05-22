import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { LogIn, LogOut, User, History, FileCheck, BookOpen, Settings, Users, Menu, X as XIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/modals';
import { useToast } from '@/components/ui';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout, loading, authError } = useAuth();
  const toast = useToast();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (authError) {
      toast.error(authError);
    }
  }, [authError]);

  const navCls = ({ isActive }: { isActive: boolean }) =>
    `cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`;

  const mobileNavCls = ({ isActive }: { isActive: boolean }) =>
    `cursor-pointer flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-lg tracking-tight">РусЯзык AI</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" end className={navCls}>
              <FileCheck className="h-4 w-4" />
              Проверка
            </NavLink>
            {!loading && user && (
              <NavLink to="/history" className={navCls}>
                <History className="h-4 w-4" />
                История
              </NavLink>
            )}
            {!loading && user && (
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

          <div className="flex items-center gap-2">
            {loading ? (
              <div className="shimmer w-24 h-8 rounded-lg" />
            ) : user ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    `hidden md:flex items-center gap-2 text-sm px-3 py-1.5 rounded-full transition-colors ${
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
                  className="cursor-pointer hidden md:flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden md:inline">Войти</span>
              </button>
            )}

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden cursor-pointer p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer — always rendered for CSS transitions */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
          mobileOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={`absolute right-0 top-0 h-full w-72 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-slate-800 text-base">РусЯзык AI</span>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <XIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Main navigation */}
          <div className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-1">
              Разделы
            </p>
            <NavLink to="/" end className={mobileNavCls} onClick={() => setMobileOpen(false)}>
              <FileCheck className="h-4 w-4 shrink-0" />
              Проверка
            </NavLink>
            {!loading && user && (
              <NavLink to="/history" className={mobileNavCls} onClick={() => setMobileOpen(false)}>
                <History className="h-4 w-4 shrink-0" />
                История
              </NavLink>
            )}
            {!loading && user && (
              <NavLink to="/students" className={mobileNavCls} onClick={() => setMobileOpen(false)}>
                <Users className="h-4 w-4 shrink-0" />
                Ученики
              </NavLink>
            )}
            <NavLink to="/functions" className={mobileNavCls} onClick={() => setMobileOpen(false)}>
              <Settings className="h-4 w-4 shrink-0" />
              Функции
            </NavLink>
          </div>

          {/* Account section — separated at the bottom */}
          <div className="border-t border-slate-100 px-3 py-4 flex flex-col gap-1">
            {!loading && user ? (
              <>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-1">
                  Аккаунт
                </p>
                <NavLink
                  to="/profile"
                  className={mobileNavCls}
                  onClick={() => setMobileOpen(false)}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                    <User className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <span className="truncate text-sm">{user.display_name || user.email}</span>
                </NavLink>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="cursor-pointer flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  Выйти из аккаунта
                </button>
              </>
            ) : !loading ? (
              <button
                onClick={() => { setShowAuth(true); setMobileOpen(false); }}
                className="cursor-pointer flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                <LogIn className="h-4 w-4" />
                Войти в аккаунт
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-3 py-4 sm:px-6 sm:py-8">{children}</main>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
};
