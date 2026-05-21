import { useAuth } from '@/context/AuthContext';
import { HistoryPanel } from '@/components/panels';
import { EmptyAuth } from '@/components/ui';

export const HistoryPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user)
    return (
      <EmptyAuth
        title="Войдите, чтобы увидеть историю"
        description="История сохраняется только для авторизованных пользователей"
      />
    );

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-800 mb-5">История проверок</h2>
      <HistoryPanel />
    </div>
  );
};
