/**
 * wheelService.ts — 幸運轉盤服務
 * 獎品池定義、加權隨機、角度計算
 */

// ─── Types ───

export type WheelPrizeType = 'points' | 'buff' | 'free_spin' | 'coupon' | 'stamp';

export interface WheelPrize {
  id: string;
  name: string;
  type: WheelPrizeType;
  value: number;          // points 數量（coupon 面額，其他為 0）
  weight: number;         // 加權機率（所有格子總和 = 1000）
  color: string;          // 轉盤扇形顏色
  textColor: string;      // 文字顏色
  icon: string;           // emoji
  description: string;    // 結果彈窗說明
  buffKey?: string;       // buff 類：localStorage key
  couponLabel?: string;   // coupon 類：顯示名稱
}

export interface WheelSpinResult {
  prize: WheelPrize;
  prizeIndex: number;     // 0-based 獎品 index
  targetAngle: number;    // 最終旋轉角度（供動畫用）
  newBalance: number;     // 扣點後 + 獎品後的積分餘額
  isFreeSpin: boolean;    // 本次是否免費轉
}

// ─── Config ───

export const WHEEL_CONFIG = {
  costPerSpin: 30,
  freeSpinBuffKey: 'moonmoon_wheel_free_spin',
  doubleCheckinBuffKey: 'moonmoon_wheel_buff_double_checkin',
};

// ─── Prize Pool ───
// weight 總和 = 1000

export const WHEEL_PRIZES: WheelPrize[] = [
  {
    id: 'points_5',
    name: '+5 積分',
    type: 'points',
    value: 5,
    weight: 300,
    color: '#D6D3D1',
    textColor: '#1C1917',
    icon: '🪙',
    description: '獲得 5 積分，繼續累積！',
  },
  {
    id: 'points_10',
    name: '+10 積分',
    type: 'points',
    value: 10,
    weight: 220,
    color: '#FDE68A',
    textColor: '#1C1917',
    icon: '✨',
    description: '獲得 10 積分！',
  },
  {
    id: 'points_25',
    name: '+25 積分',
    type: 'points',
    value: 25,
    weight: 150,
    color: '#FCD34D',
    textColor: '#1C1917',
    icon: '⭐',
    description: '獲得 25 積分，不錯的收穫！',
  },
  {
    id: 'buff_double_checkin',
    name: '雙倍簽到',
    type: 'buff',
    value: 0,
    weight: 100,
    color: '#BEF264',
    textColor: '#1C1917',
    icon: '🌿',
    description: '明日簽到積分加倍！好好利用它。',
    buffKey: WHEEL_CONFIG.doubleCheckinBuffKey,
  },
  {
    id: 'free_spin',
    name: '免費再轉',
    type: 'free_spin',
    value: 30,
    weight: 80,
    color: '#C4B5FD',
    textColor: '#1C1917',
    icon: '🎡',
    description: '下一次轉盤免費！運氣來了擋不住。',
  },
  {
    id: 'points_50',
    name: '+50 積分',
    type: 'points',
    value: 50,
    weight: 60,
    color: '#FDBA74',
    textColor: '#1C1917',
    icon: '🌟',
    description: '獲得 50 積分！今天手氣不錯。',
  },
  {
    id: 'coupon_drink',
    name: '飲品折扣碼',
    type: 'coupon',
    value: 80,
    weight: 50,
    color: '#93C5FD',
    textColor: '#1C1917',
    icon: '☕',
    description: '可折抵飲品 80 元，出示給店員確認。',
    couponLabel: '飲品折扣 80 元',
  },
  {
    id: 'points_100',
    name: '+100 積分',
    type: 'points',
    value: 100,
    weight: 25,
    color: '#FDA4AF',
    textColor: '#1C1917',
    icon: '💫',
    description: '大獎！獲得 100 積分！',
  },
  {
    id: 'stamp_wheel',
    name: '限定印章',
    type: 'stamp',
    value: 0,
    weight: 10,
    color: '#1C1917',
    textColor: '#FFFFFF',
    icon: '🔮',
    description: '稀有轉盤限定印章，集章任務加一！',
  },
  {
    id: 'coupon_dessert',
    name: '免費甜點券',
    type: 'coupon',
    value: 200,
    weight: 5,
    color: '#F59E0B',
    textColor: '#1C1917',
    icon: '🍮',
    description: '免費甜點一份！快點到店核銷。',
    couponLabel: '免費甜點兌換券',
  },
];

// ─── Utils ───

const TOTAL_WEIGHT = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
const SEGMENT_ANGLE = 360 / WHEEL_PRIZES.length;

/**
 * 加權隨機抽取獎品
 */
export function drawPrize(): { prize: WheelPrize; prizeIndex: number } {
  let random = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    if (random < WHEEL_PRIZES[i].weight) {
      return { prize: WHEEL_PRIZES[i], prizeIndex: i };
    }
    random -= WHEEL_PRIZES[i].weight;
  }
  return { prize: WHEEL_PRIZES[0], prizeIndex: 0 };
}

/**
 * 計算轉盤停止角度
 * 轉至少 5 圈 + 停在 prizeIndex 對應的扇形中心
 * 指針固定在 12 點鐘方向（頂部）
 */
export function calculateTargetAngle(prizeIndex: number, currentRotation: number): number {
  const prizeCenter = prizeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const targetInCircle = (360 - prizeCenter + 360) % 360;
  const fullSpins = 5 * 360;
  return currentRotation + fullSpins + targetInCircle - (currentRotation % 360);
}

/**
 * 檢查是否有免費轉機會
 */
export function consumeFreeSpin(): boolean {
  try {
    const val = localStorage.getItem(WHEEL_CONFIG.freeSpinBuffKey);
    if (val === 'true') {
      localStorage.removeItem(WHEEL_CONFIG.freeSpinBuffKey);
      return true;
    }
  } catch (e) {
    console.error('Failed to read free spin buff:', e);
  }
  return false;
}

export function grantFreeSpin(): void {
  try {
    localStorage.setItem(WHEEL_CONFIG.freeSpinBuffKey, 'true');
  } catch (e) {
    console.error('Failed to grant free spin:', e);
  }
}

/**
 * 設定雙倍簽到 buff（明天簽到用）
 */
export function grantDoubleCheckin(): void {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    localStorage.setItem(WHEEL_CONFIG.doubleCheckinBuffKey, dateStr);
  } catch (e) {
    console.error('Failed to grant double checkin buff:', e);
  }
}
