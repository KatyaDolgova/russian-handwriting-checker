import { useState, useEffect } from 'react';
import {
  User, Lock, BarChart2, Save, Eye, EyeOff,
  BookOpen, Users, FolderOpen, TrendingUp, CheckCircle,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

interface Stats {
  total_checks: number;
  unique_students: number;
  avg_pct: number;
  most_active_month: string | null;
  total_folders: number;
  total_groups: number;
}

interface Rank { label: string; color: string }

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  email: string;
  stats: Stats;
  rank: Rank;
}

const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  slate:  { bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-200' },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200' },
  indigo: { bg: 'bg-indigo-50',  text: 'text-indigo-700', border: 'border-indigo-200' },
  violet: { bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200' },
  amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200' },
};

const MONTHS_RU = [
  'январь','февраль','март','апрель','май','июнь',
  'июль','август','сентябрь','октябрь','ноябрь','декабрь',
];

function formatMonth(raw: string | null) {
  if (!raw) return '—';
  const [year, month] = raw.split('-');
  return `${MONTHS_RU[parseInt(month) - 1]} ${year}`;
}

function Avatar({ name, email }: { name?: string | null; email?: string }) {
  const letter = (name?.[0] || email?.[0] || '?').toUpperCase();
  return (
    <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-semibold select-none">
      {letter}
    </div>
  );
}

const RANK_THRESHOLDS = [
  { min: 0,  max: 5,   next: 5 },
  { min: 5,  max: 20,  next: 20 },
  { min: 20, max: 50,  next: 50 },
  { min: 50, max: 100, next: 100 },
];

function RankProgress({ total }: { total: number }) {
  const tier = RANK_THRESHOLDS.find(t => total >= t.min && total < t.max);
  if (!tier) return null;
  const pct = Math.round(((total - tier.min) / (tier.max - tier.min)) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>До следующего уровня</span>
        <span>{total} / {tier.next}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-slate-400 mt-1">Ещё {tier.next - total} проверок</p>
    </div>
  );
}

function StatCard({ icon, label, value, wide = false }: {
  icon: React.ReactNode; label: string; value: string; wide?: boolean;
}) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 p-4 ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-2 mb-2 text-slate-400">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

function SectionCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 mb-5">
        {icon}{title}
      </h2>
      {children}
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateDisplayName } = useAuth();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    setLoading(true);
    setLoadError('');
    api.get('/api/auth/me')
      .then(res => {
        const d = res.data as ProfileData;
        setData(d);
        setDisplayName(d.display_name || '');
        setBio(d.bio || '');
      })
      .catch(() => setLoadError('Не удалось загрузить данные профиля'))
      .finally(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.put('/api/auth/profile', {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
      });
      updateDisplayName(displayName.trim() || null);
      setData(prev => prev ? { ...prev, display_name: displayName.trim() || null } : prev);
      setProfileMsg({ text: 'Профиль сохранён', ok: true });
    } catch (e: any) {
      setProfileMsg({ text: e?.response?.data?.detail || 'Ошибка сохранения', ok: false });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPwd !== confirmPwd) { setPwdMsg({ text: 'Пароли не совпадают', ok: false }); return; }
    if (newPwd.length < 6)     { setPwdMsg({ text: 'Минимум 6 символов', ok: false }); return; }
    setSavingPwd(true);
    setPwdMsg(null);
    try {
      await api.post('/api/auth/password', { current_password: curPwd, new_password: newPwd });
      setPwdMsg({ text: 'Пароль успешно изменён', ok: true });
      setCurPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (e: any) {
      setPwdMsg({ text: e?.response?.data?.detail || 'Ошибка смены пароля', ok: false });
    } finally {
      setSavingPwd(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 max-w-md mx-auto">
        <User className="h-10 w-10 text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">Войдите, чтобы открыть профиль</p>
      </div>
    );
  }

  const rankStyle = data ? RANK_COLORS[data.rank.color] : RANK_COLORS.slate;

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Hero */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 flex items-center gap-5">
        <Avatar name={data?.display_name} email={user.email} />
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {data?.display_name || user.email?.split('@')[0]}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">{user.email}</p>
          {data?.rank && (
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium border ${rankStyle.bg} ${rankStyle.text} ${rankStyle.border}`}>
              {data.rank.label}
            </span>
          )}
        </div>
      </div>

      {loading && (
        <p className="text-sm text-slate-400 text-center py-4">Загрузка...</p>
      )}
      {loadError && (
        <p className="text-sm text-red-500 text-center py-4">{loadError}</p>
      )}

      {!loading && (
        <>
          {/* Profile section */}
          <SectionCard title="Профиль" icon={<User className="h-4 w-4 text-indigo-500" />}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Отображаемое имя</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Иванова Мария Петровна"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  value={user.email}
                  readOnly
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 text-slate-400 cursor-default"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">О себе</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Учитель русского языка, 12 лет опыта..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
                />
              </div>
              {profileMsg && (
                <p className={`text-sm ${profileMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {profileMsg.text}
                </p>
              )}
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                {savingProfile ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </SectionCard>

          {/* Security section */}
          <SectionCard title="Безопасность" icon={<Lock className="h-4 w-4 text-indigo-500" />}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showCur ? 'text' : 'password'}
                    value={curPwd}
                    onChange={e => setCurPwd(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <button type="button" onClick={() => setShowCur(v => !v)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Новый пароль</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPwd}
                      onChange={e => setNewPwd(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Повторите пароль</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPwd}
                      onChange={e => setConfirmPwd(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              {pwdMsg && (
                <p className={`text-sm ${pwdMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pwdMsg.text}
                </p>
              )}
              <button
                onClick={changePassword}
                disabled={savingPwd || !curPwd || !newPwd || !confirmPwd}
                className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Lock className="h-4 w-4" />
                {savingPwd ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </div>
          </SectionCard>

          {/* Stats section */}
          {data && (
            <SectionCard title="Статистика" icon={<BarChart2 className="h-4 w-4 text-indigo-500" />}>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<CheckCircle className="h-4 w-4 text-indigo-400" />}
                  label="Проверок выполнено" value={String(data.stats.total_checks)} />
                <StatCard icon={<Users className="h-4 w-4 text-blue-400" />}
                  label="Уникальных учеников" value={String(data.stats.unique_students)} />
                <StatCard icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
                  label="Средний балл" value={data.stats.avg_pct > 0 ? `${data.stats.avg_pct}%` : '—'} />
                <StatCard icon={<BookOpen className="h-4 w-4 text-violet-400" />}
                  label="Самый активный месяц" value={formatMonth(data.stats.most_active_month)} />
                <StatCard icon={<FolderOpen className="h-4 w-4 text-amber-400" />}
                  label="Папок создано" value={String(data.stats.total_folders)} />
                <StatCard icon={<Users className="h-4 w-4 text-rose-400" />}
                  label="Групп создано" value={String(data.stats.total_groups)} />
              </div>

              {data.stats.total_checks >= 0 && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <RankProgress total={data.stats.total_checks} />
                </div>
              )}
            </SectionCard>
          )}
        </>
      )}
    </div>
  );
}
