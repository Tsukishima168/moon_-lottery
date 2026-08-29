/**
 * supabase.ts — re-exports auth.ts singleton，確保全站只有一個 Supabase client 實例
 * 不要在這裡再 createClient()；所有 auth 設定集中在 auth.ts
 */
import { getAuthClient, getSupabaseConfigurationIssue } from './auth';

/** 全站唯一 Supabase client（來自 auth.ts singleton） */
export const supabase = getAuthClient();
export const hasSupabaseEnv = Boolean(supabase);

export const supabaseEnvWarning = getSupabaseConfigurationIssue();
