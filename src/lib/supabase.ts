import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

// Cookie helpers — domain = .kiwimu.com → 跨子網域共享 session
const COOKIE_DOMAIN = '.kiwimu.com'

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}
function setCookie(name: string, value: string, maxAgeSec = 60 * 60 * 24 * 365) {
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `domain=${COOKIE_DOMAIN}`, `path=/`,
    `max-age=${maxAgeSec}`, 'SameSite=Lax',
  ].join('; ')
}
function deleteCookie(name: string) {
  document.cookie = `${name}=; domain=${COOKIE_DOMAIN}; path=/; max-age=0`
}

export const supabase: SupabaseClient | null = hasSupabaseEnv
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        storage: {
          getItem: (key) => getCookie(key),
          setItem: (key, value) => setCookie(key, value),
          removeItem: (key) => deleteCookie(key),
        },
      },
    })
  : null

export const supabaseEnvWarning = hasSupabaseEnv
  ? null
  : 'Supabase 環境變數未設定，會員登入與雲端同步已暫時停用。'
