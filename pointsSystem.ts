/**
 * pointsSystem.ts — 月島積分系統（升級版：localStorage + Supabase 雙寫）
 * v2.0 (2026-02-26) — 對齊全站 gamification-types.ts 規格
 *
 * 設計原則：
 * - localStorage 是即時 UI 的主要來源（不等網路）
 * - Supabase 是持久化備份（async，失敗不阻塞）
 * - getDeviceId() 與 Passport 共用同一個 localStorage key（moonmoon_device_id）
 */

import { supabase } from './src/lib/supabase';

// ─── Storage Keys ───
const DEVICE_ID_KEY = 'moonmoon_device_id';
const POINTS_KEY = 'moonmoon_points';
const TRANSACTIONS_KEY = 'moonmoon_points_tx';
const WEEKLY_LIMIT_PREFIX = 'kiwimu_weekly_limit_';
const PASSPORT_SYNC_CURSOR_KEY = 'moonmoon_gacha_passport_sync_cursor_ts';

// ─── Types (對齊 gamification-types.ts PointAction) ───
export type PointAction =
  | 'gacha_earn'      // 扭蛋獲得積分
  | 'daily_checkin'   // 每日簽到
  | 'bonus';          // 其他獎勵

export interface PointTransaction {
  id: string;
  type: PointAction;
  amount: number;
  description: string;
  timestamp: number;
}

export interface PendingPassportSync {
  amount: number;
  latestTimestamp: number;
  transactionCount: number;
}


// ─── Device Binding ───

/**
 * Generate or retrieve a persistent device UUID.
 * 與 Passport 共用同一個 key（moonmoon_device_id）→ 跨站積分合併的基礎
 */
export function getDeviceId(): string {
  let id: string | null = null;

  try {
    id = localStorage.getItem(DEVICE_ID_KEY);
  } catch (e) {
    console.error('Failed to read device ID:', e);
  }

  if (!id) {
    id = crypto.randomUUID();
    try {
      localStorage.setItem(DEVICE_ID_KEY, id);
    } catch (e) {
      console.error('Failed to persist device ID:', e);
    }
  }
  return id;
}

// ─── Points Balance ───

export function getPointsBalance(): number {
  try {
    const raw = localStorage.getItem(POINTS_KEY);
    if (raw) {
      const val = parseInt(raw, 10);
      return isNaN(val) ? 0 : val;
    }
  } catch (e) {
    console.error('Failed to read points:', e);
  }
  return 0;
}

export function addPoints(amount: number, type: PointTransaction['type'], description: string): number {
  const current = getPointsBalance();
  const newBalance = current + amount;

  try {
    localStorage.setItem(POINTS_KEY, String(newBalance));
  } catch (e) {
    console.error('Failed to write points:', e);
  }

  // Record transaction in localStorage
  const tx: PointTransaction = {
    id: crypto.randomUUID(),
    type,
    amount,
    description,
    timestamp: Date.now(),
  };
  appendTransaction(tx);

  // ── 🆕 Supabase 雙寫（async，fire-and-forget）──
  void syncTransactionToSupabase(getDeviceId(), amount, type, description);

  return newBalance;
}

// ─── Supabase Sync ─────────────────────────────────────────────────────────────

/**
 * 將積分交易非同步寫入 Supabase point_transactions
 * 失敗不影響 UX（localStorage 已成功）
 */
async function syncTransactionToSupabase(
  deviceId: string,
  points: number,
  action: string,
  description: string
): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase
      .from('point_transactions')
      .insert({
        device_id: deviceId,
        points,
        action,
        description,
        source: 'gacha',
      });
    if (error) {
      console.warn('[pointsSystem] Supabase sync failed:', error.message);
    }
  } catch (e) {
    console.warn('[pointsSystem] Supabase sync exception:', e);
  }
}

// ─── Transaction History ───

function appendTransaction(tx: PointTransaction): void {
  try {
    const history = getTransactionHistory();
    history.push(tx);
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to write transaction:', e);
  }
}

export function getTransactionHistory(): PointTransaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read transactions:', e);
  }
  return [];
}

export function getPendingPassportSync(): PendingPassportSync | null {
  try {
    const cursorRaw = localStorage.getItem(PASSPORT_SYNC_CURSOR_KEY);
    const cursor = cursorRaw ? parseInt(cursorRaw, 10) : 0;
    const pendingTransactions = getTransactionHistory()
      .filter((tx) => tx.type === 'gacha_earn' && tx.amount > 0 && tx.timestamp > cursor)
      .sort((a, b) => a.timestamp - b.timestamp);

    if (pendingTransactions.length === 0) {
      return null;
    }

    return {
      amount: pendingTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      latestTimestamp: pendingTransactions[pendingTransactions.length - 1].timestamp,
      transactionCount: pendingTransactions.length,
    };
  } catch (e) {
    console.error('Failed to compute pending Passport sync:', e);
    return null;
  }
}

export function markPassportSyncPrepared(syncTimestamp: number): void {
  try {
    localStorage.setItem(PASSPORT_SYNC_CURSOR_KEY, String(syncTimestamp));
  } catch (e) {
    console.error('Failed to persist Passport sync cursor:', e);
  }
}

// ─── Cross-Site Sync Helper ───

/**
 * Build the URL to redirect user to Passport with points info.
 * Used as a fallback when Supabase is not available.
 */
export function buildPassportSyncUrl(
  passportBaseUrl: string,
  pointsToSync: number,
  source: string,
  syncTimestamp: number = Date.now()
): string {
  const deviceId = getDeviceId();
  const params = new URLSearchParams({
    action: 'add_points',
    amount: String(pointsToSync),
    source,
    device_id: deviceId,
    ts: String(syncTimestamp),
  });
  return `${passportBaseUrl}?${params.toString()}`;
}
