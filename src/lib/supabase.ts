/**
 * supabase.ts — re-exports auth.ts singleton，確保全站只有一個 Supabase client 實例
 * 不要在這裡再 createClient()；所有 auth 設定集中在 auth.ts
 */
import { getAuthClient } from './auth';

export const hasSupabaseEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

/** 全站唯一 Supabase client（來自 auth.ts singleton） */
export const supabase = getAuthClient();

export const supabaseEnvWarning = hasSupabaseEnv
  ? null
  : 'Supabase 環境變數未設定，會員登入與雲端同步已暫時停用。';
