import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '@/api';

interface User {
  user_id: string;
  email: string;
  display_name?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<string>;
  logout: () => void;
  updateDisplayName: (name: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !!localStorage.getItem('access_token'));
  const [authError, setAuthError] = useState<string | null>(null);

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setAuthError(null);
    api
      .get('/api/auth/me')
      .then((res) => {
        setUser({
          user_id: res.data.user_id,
          email: res.data.email,
          display_name: res.data.display_name ?? null,
        });
      })
      .catch((e) => {
        const status = e?.response?.status;
        if (status === 401) {
          logout();
        } else {
          logout();
          setAuthError(
            status >= 500
              ? 'Сервер недоступен. Попробуйте войти позже.'
              : 'Не удалось загрузить данные аккаунта. Попробуйте снова.',
          );
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const { access_token } = res.data;
    localStorage.setItem('access_token', access_token);
    setToken(access_token);
  };

  const register = async (email: string, password: string): Promise<string> => {
    const res = await api.post('/api/auth/register', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('access_token', res.data.access_token);
      setToken(res.data.access_token);
    }
    return res.data.message || 'Регистрация прошла успешно';
  };

  const updateDisplayName = (name: string | null) => {
    setUser((prev) => (prev ? { ...prev, display_name: name } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, authError, login, register, logout, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
