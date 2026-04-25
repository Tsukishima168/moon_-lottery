import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createSharedAuthStorage } from './authStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase: SupabaseClient | null = hasSupabaseEnv
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        storage: createSharedAuthStorage(),
      },
    })
  : null

export const supabaseEnvWarning = hasSupabaseEnv
  ? null
  : 'Supabase 環境變數未設定，會員登入與雲端同步已暫時停用。'
