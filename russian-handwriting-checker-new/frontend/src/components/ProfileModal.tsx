import { useState, useEffect } from 'react';
import {
  X, User, Lock, BarChart2, Save, Eye, EyeOff,
  BookOpen, Users, FolderOpen, Star, TrendingUp, CheckCircle,
} from 'lucide-react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

type Tab = 'profile' | 'security' | 'stats';

interface Stats {
  total_checks: number;
  unique_students: number;
  avg_pct: number;
  most_active_month: string | null;
  total_folders: number;
  total_groups: number;
}

interface Rank {
  label: string;
  color: string;
}

interface ProfileData {
  display_name: string | null;
  bio: string | null;
  stats: Stats;
  rank: Rank;
}

const RANK_COLORS: Record<string, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
};

const MONTHS_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

function formatMonth(raw: string | null): string {
  if (!raw) return '—';
  const [year, month] = raw.split('-');
  return `${MONTHS_RU[parseInt(month) - 1]} ${year}`;
}

function Avatar({ name, email, size = 'lg' }: { name?: string | null; email?: string; size?: 'sm' | 'lg' }) {
  const letter = (name?.[0] || email?.[0] || '?').toUpperCase();
  const cls = size === 'lg'
    ? 'w-16 h-16 text-2xl'
    : 'w-10 h-10 text-base';
  return (
    <div className={`${cls} rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold select-none`}>
      {letter}
    </div>
  );
}

export default function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, updateDisplayName } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [curPwd, setCurPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then(res => {
        const d = res.data as ProfileData & { display_name: string | null; bio: string | null };
        setProfileData(d);
        setDisplayName(d.display_name || '');
        setBio(d.bio || '');
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.put('/api/auth/profile', { display_name: displayName || null, bio: bio || null });
      updateDisplayName(displayName || null);
      setProfileMsg({ text: 'Профиль сохранён', ok: true });
    } catch (e: any) {
      setProfileMsg({ text: e?.response?.data?.detail || 'Ошибка сохранения', ok: false });
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (newPwd !== confirmPwd) {
      setPwdMsg({ text: 'Пароли не совпадают', ok: false });
      return;
    }
    if (newPwd.length < 6) {
      setPwdMsg({ text: 'Новый пароль слишком короткий (минимум 6 символов)', ok: false });
      return;
    }
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

  const tabCls = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
      tab === t ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Avatar name={profileData?.display_name} email={user?.email} size="sm" />
            <div>
              <p className="font-semibold text-slate-800 leading-tight">
                {profileData?.display_name || user?.email?.split('@')[0] || 'Профиль'}
              </p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="cursor-pointer text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-2">
          <button className={tabCls('profile')} onClick={() => setTab('profile')}>
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Профиль</span>
          </button>
          <button className={tabCls('security')} onClick={() => setTab('security')}>
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" />Безопасность</span>
          </button>
          <button className={tabCls('stats')} onClick={() => setTab('stats')}>
            <span className="flex items-center gap-1.5"><BarChart2 className="h-3.5 w-3.5" />Статистика</span>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 pb-6 flex-1">

          {/* Profile tab */}
          {tab === 'profile' && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col items-center py-4">
                <Avatar name={profileData?.display_name} email={user?.email} />
                {profileData?.rank && (
                  <span className={`mt-3 px-3 py-1 rounded-full text-xs font-medium border ${RANK_COLORS[profileData.rank.color]}`}>
                    {profileData.rank.label}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Отображаемое имя</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Иванова Мария Петровна"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  value={user?.email || ''}
                  readOnly
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-slate-50 text-slate-400 cursor-default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">О себе</label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Учитель русского языка, 12 лет опыта..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 resize-none"
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
                className="cursor-pointer w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Save className="h-4 w-4" />
                {savingProfile ? 'Сохранение...' : 'Сохранить профиль'}
              </button>
            </div>
          )}

          {/* Security tab */}
          {tab === 'security' && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-slate-500 pt-1">
                Для смены пароля введите текущий, затем новый пароль дважды.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Текущий пароль</label>
                <div className="relative">
                  <input
                    type={showCur ? 'text' : 'password'}
                    value={curPwd}
                    onChange={e => setCurPwd(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCur(v => !v)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Повторите новый пароль</label>
                <input
                  type="password"
                  value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>

              {pwdMsg && (
                <p className={`text-sm ${pwdMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                  {pwdMsg.text}
                </p>
              )}

              <button
                onClick={changePassword}
                disabled={savingPwd || !curPwd || !newPwd || !confirmPwd}
                className="cursor-pointer w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Lock className="h-4 w-4" />
                {savingPwd ? 'Изменение...' : 'Изменить пароль'}
              </button>
            </div>
          )}

          {/* Stats tab */}
          {tab === 'stats' && (
            <div className="pt-2">
              {loadingData ? (
                <p className="text-sm text-slate-400 py-6 text-center">Загрузка...</p>
              ) : profileData ? (
                <div className="space-y-5">
                  {/* Rank banner */}
                  <div className={`flex items-center gap-3 p-4 rounded-xl border ${RANK_COLORS[profileData.rank.color]}`}>
                    <Star className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{profileData.rank.label}</p>
                      <p className="text-xs opacity-75">Ваш текущий уровень</p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon={<CheckCircle className="h-4 w-4 text-indigo-500" />}
                      label="Проверок всего"
                      value={String(profileData.stats.total_checks)}
                    />
                    <StatCard
                      icon={<Users className="h-4 w-4 text-blue-500" />}
                      label="Учеников"
                      value={String(profileData.stats.unique_students)}
                    />
                    <StatCard
                      icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                      label="Средний балл"
                      value={profileData.stats.avg_pct > 0 ? `${profileData.stats.avg_pct}%` : '—'}
                    />
                    <StatCard
                      icon={<BookOpen className="h-4 w-4 text-violet-500" />}
                      label="Самый активный месяц"
                      value={formatMonth(profileData.stats.most_active_month)}
                      small
                    />
                    <StatCard
                      icon={<FolderOpen className="h-4 w-4 text-amber-500" />}
                      label="Папок создано"
                      value={String(profileData.stats.total_folders)}
                    />
                    <StatCard
                      icon={<Users className="h-4 w-4 text-rose-400" />}
                      label="Групп создано"
                      value={String(profileData.stats.total_groups)}
                    />
                  </div>

                  {/* Progress to next rank */}
                  <RankProgress total={profileData.stats.total_checks} />
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-6 text-center">Не удалось загрузить статистику</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, small = false,
}: {
  icon: React.ReactNode; label: string; value: string; small?: boolean;
}) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs text-slate-500">{label}</span></div>
      <p className={`font-semibold text-slate-800 ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
    </div>
  );
}

const RANK_THRESHOLDS = [
  { min: 0, max: 5, label: 'Новичок → Начинающий', next: 5 },
  { min: 5, max: 20, label: 'Начинающий → Опытный учитель', next: 20 },
  { min: 20, max: 50, label: 'Опытный учитель → Мастер', next: 50 },
  { min: 50, max: 100, label: 'Мастер → Эксперт', next: 100 },
];

function RankProgress({ total }: { total: number }) {
  const tier = RANK_THRESHOLDS.find(t => total >= t.min && total < t.max);
  if (!tier) return null;
  const pct = Math.round(((total - tier.min) / (tier.max - tier.min)) * 100);
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex justify-between text-xs text-slate-500 mb-2">
        <span>{tier.label}</span>
        <span>{total} / {tier.max}</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1.5">
        Ещё {tier.next - total} проверок до следующего уровня
      </p>
    </div>
  );
}
