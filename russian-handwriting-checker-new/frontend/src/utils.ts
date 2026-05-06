import { MONTHS_RU } from './constants';

export const formatMonth = (raw: string | null) => {
  if (!raw) return '—';
  const [year, month] = raw.split('-');
  return `${MONTHS_RU[parseInt(month) - 1]} ${year}`;
};

export const formatDate = (iso: string) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const toLocalDatetime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const scoreColor = (pct: number) => {
  return pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
};
