import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import api from '../api';

interface User {
  user_id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!token) return;
    api.get('/api/auth/me').then((res) => setUser(res.data)).catch(() => logout());
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

  const logout = () => {
    localStorage.removeItem('access_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
