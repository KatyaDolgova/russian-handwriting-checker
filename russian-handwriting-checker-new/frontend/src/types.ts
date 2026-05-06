export type DateFilter = 'all' | 'week' | 'month' | 'custom';
export type SortKey = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';
export type ToastType = 'error' | 'success' | 'info';
export type Tab = 'mine' | 'gallery';

export interface Folder {
  id: string;
  name: string;
  description?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
}

export interface CheckRecord {
  id: string;
  filename: string;
  title?: string | null;
  pupil_name?: string;
  score: number;
  score_max: number;
  comment: string;
  corrected_text?: string;
  original_text?: string;
  folder_id?: string | null;
  work_date?: string;
  created_at: string;
}

export interface EditForm {
  score: string;
  scoreMax: string;
  comment: string;
  corrected_text: string;
  pupil_name: string;
  workDate: string;
  folder_id: string;
}
export interface GalleryFn {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  author_display_name: string;
  author_user_id: string | null;
  version_number: number;
}

export interface Fn {
  id: string;
  name: string;
  description: string;
  user_id?: string | null;
  system_prompt?: string;
  user_template?: string;
  is_default?: boolean;
  is_published?: boolean;
  original_function_id?: string | null;
}

export interface FnVersion {
  id: string;
  version_number: number;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  change_note: string | null;
  created_at: string;
}

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}
