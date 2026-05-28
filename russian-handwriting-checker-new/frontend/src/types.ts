export type DateFilter = 'all' | 'week' | 'month' | 'custom';
export type SortKey = 'date_desc' | 'date_asc' | 'score_desc' | 'score_asc';
export type ToastType = 'error' | 'success' | 'info';
export type Tab = 'mine' | 'gallery';
export type PctFilter = 'all' | 'low' | 'mid' | 'high';
export type StudentsSortKey = 'works_desc' | 'pct_desc' | 'pct_asc' | 'name_asc' | 'date_desc';

export interface Folder {
  id: string;
  name: string;
}

export interface Group {
  id: string;
  name: string;
}

export interface Student {
  id: string;
  name: string;
}

export interface CheckError {
  original: string;
  corrected?: string;
  type?: string;
  comment?: string;
}

export interface CheckRecord {
  id: string;
  filename: string;
  title?: string | null;
  student_id?: string | null;
  student_name?: string | null;
  pass_fail?: string | null;
  score: number | null;
  score_max: number | null;
  comment: string;
  corrected_text?: string;
  original_text?: string;
  errors?: CheckError[] | null;
  criteria?: Record<
    string,
    { score?: number; result?: string | number; max?: number; comment?: string }
  > | null;
  folder_id?: string | null;
  work_date?: string;
  created_at: string;
}

export interface EditForm {
  pass_fail?: string;
  score: string;
  scoreMax: string;
  comment: string;
  corrected_text: string;
  student_id: string;
  workDate: string;
  folder_id: string;
}
export interface GalleryFn {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  user_template: string;
  author_display_name: string | null;
  author_email: string | null;
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
  score_max?: number | null;
  min_words?: number | null;
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
