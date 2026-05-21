import { useAuth } from '@/context/AuthContext';
import { StudentsPanel } from '@/components/panels';
import { EmptyAuth } from '@/components/ui';

export const StudentsPage = () => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user)
    return (
      <EmptyAuth
        title="Войдите, чтобы видеть учеников"
        description="Статистика учеников доступна только авторизованным пользователям"
      />
    );

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-800 mb-5">Статистика учеников</h2>
      <StudentsPanel />
    </div>
  );
};
