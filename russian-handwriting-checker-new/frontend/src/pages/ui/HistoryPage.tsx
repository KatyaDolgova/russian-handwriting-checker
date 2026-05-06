import { useAuth } from '@/context/AuthContext';
import { HistoryPanel } from '@/components/panels';
import { EmptyAuth } from '@/components/ui';

export const HistoryPage = () => {
  const { user } = useAuth();

  if (!user) return <EmptyAuth />;

  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold text-slate-800 mb-5">История проверок</h2>
      <HistoryPanel />
    </div>
  );
};
