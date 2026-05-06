import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ToastType } from '@/types';

export const POLL_INTERVAL = 1500;
export const POLL_TIMEOUT = 120_000;

export const RANK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const MONTHS_RU = [
  'январь',
  'февраль',
  'март',
  'апрель',
  'май',
  'июнь',
  'июль',
  'август',
  'сентябрь',
  'октябрь',
  'ноябрь',
  'декабрь',
];

export const RANK_THRESHOLDS = [
  { min: 0, max: 5, next: 5 },
  { min: 5, max: 20, next: 20 },
  { min: 20, max: 50, next: 50 },
  { min: 50, max: 100, next: 100 },
];

export const PALETTE = [
  'bg-violet-50 border-violet-200 text-violet-700 data-[active=true]:bg-violet-600 data-[active=true]:text-white data-[active=true]:border-violet-600 hover:bg-violet-100',
  'bg-blue-50 border-blue-200 text-blue-700 data-[active=true]:bg-blue-600 data-[active=true]:text-white data-[active=true]:border-blue-600 hover:bg-blue-100',
  'bg-emerald-50 border-emerald-200 text-emerald-700 data-[active=true]:bg-emerald-600 data-[active=true]:text-white data-[active=true]:border-emerald-600 hover:bg-emerald-100',
  'bg-amber-50 border-amber-200 text-amber-700 data-[active=true]:bg-amber-600 data-[active=true]:text-white data-[active=true]:border-amber-600 hover:bg-amber-100',
  'bg-rose-50 border-rose-200 text-rose-700 data-[active=true]:bg-rose-600 data-[active=true]:text-white data-[active=true]:border-rose-600 hover:bg-rose-100',
  'bg-slate-50 border-slate-200 text-slate-600 data-[active=true]:bg-slate-700 data-[active=true]:text-white data-[active=true]:border-slate-700 hover:bg-slate-100',
];

export const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: ReactNode }> = {
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />,
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />,
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
  },
};
