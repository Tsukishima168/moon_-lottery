/**
 * Gacha — Supabase Auth（跨網域 cookie）
 * 讀取 .kiwimu.com cookie session（由 Passport 設定）
 * 登入入口透過 Passport popup broker 完成，保留原站畫面
 */

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { createSharedAuthStorage, openPassportLogin, type OpenPassportLoginOptions } from './authStorage';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const EXPECTED_SUPABASE_PROJECT_REF = 'xlqwfaailjyvsycjnzkz';

export function getSupabaseConfigurationIssue(): string | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return 'Supabase 環境變數未設定，會員登入與 Economy v2 已安全停用。';
  }

  try {
    const url = new URL(SUPABASE_URL);
    const expectedHost = `${EXPECTED_SUPABASE_PROJECT_REF}.supabase.co`;
    if (url.protocol !== 'https:' || url.hostname !== expectedHost) {
      return 'Supabase 專案識別不符，會員登入與 Economy v2 已安全停用。';
    }
  } catch {
    return 'Supabase URL 無效，會員登入與 Economy v2 已安全停用。';
  }

  return null;
}
// ── Auth Client（cookie storage，單例）───────────────────────────────────────

let _authClient: SupabaseClient | null = null;

export function getAuthClient(): SupabaseClient | null {
  if (getSupabaseConfigurationIssue()) return null;
  if (_authClient) return _authClient;

  _authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storage: createSharedAuthStorage(),
    },
  });

  return _authClient;
}

// ── Auth 方法 ─────────────────────────────────────────────────────────────────

/** 取得目前登入 user（null = 未登入） */
export async function getCurrentUser(): Promise<User | null> {
  const client = getAuthClient();
  if (!client) return null;
  const { data: { user } } = await client.auth.getUser();
  return user;
}

/** 透過 Passport popup broker 登入 */
export async function signInWithGoogle(options: OpenPassportLoginOptions = {}): Promise<void> {
  openPassportLogin({ ...options, intent: options.intent || 'gacha_login' });
}

/** 登出 */
export async function signOut(): Promise<void> {
  const client = getAuthClient();
  if (!client) return;
  await client.auth.signOut();
}
