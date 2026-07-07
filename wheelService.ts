/**
 * wheelService.ts — 扭蛋機服務
 * 獎品池定義、加權隨機
 */

// ─── Types ───

export type WheelPrizeType = 'points' | 'free_spin' | 'coupon' | 'stamp';

export interface WheelPrize {
  id: string;
  name: string;
  type: WheelPrizeType;
  value: number;          // points 數量（coupon 面額，其他為 0）
  weight: number;         // 加權機率（所有格子總和 = 1000）
  color: string;          // 扭蛋 / 獎品顏色
  textColor: string;      // 文字顏色
  icon: string;           // short display code
  description: string;    // 結果彈窗說明
  couponLabel?: string;   // coupon 類：顯示名稱
}

// ─── Config ───

export const WHEEL_CONFIG = {
  costPerSpin: 30,
  freeSpinBuffKey: 'moonmoon_wheel_free_spin',
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
    color: '#E5E5E5',
    textColor: '#111111',
    icon: 'P5',
    description: '獲得 5 積分，繼續累積！',
  },
  {
    id: 'points_10',
    name: '+10 積分',
    type: 'points',
    value: 10,
    weight: 220,
    color: '#FFFDF7',
    textColor: '#111111',
    icon: 'P10',
    description: '獲得 10 積分！',
  },
  {
    id: 'points_25',
    name: '+25 積分',
    type: 'points',
    value: 25,
    weight: 150,
    color: '#D4AF37',
    textColor: '#111111',
    icon: 'P25',
    description: '獲得 25 積分，不錯的收穫！',
  },
  {
    id: 'points_20',
    name: '+20 積分',
    type: 'points',
    value: 20,
    weight: 100,
    color: '#D9CBA3',
    textColor: '#111111',
    icon: 'P20',
    description: '獲得 20 積分！',
  },
  {
    id: 'free_spin',
    name: '免費再扭',
    type: 'free_spin',
    value: 30,
    weight: 80,
    color: '#F4F4F0',
    textColor: '#111111',
    icon: 'FS',
    description: '下一次扭蛋免費！運氣來了擋不住。',
  },
  {
    id: 'points_50',
    name: '+50 積分',
    type: 'points',
    value: 50,
    weight: 60,
    color: '#C9A46A',
    textColor: '#111111',
    icon: 'P50',
    description: '獲得 50 積分！今天手氣不錯。',
  },
  {
    id: 'coupon_drink',
    name: '飲品折扣碼',
    type: 'coupon',
    value: 80,
    weight: 50,
    color: '#2A9D8F',
    textColor: '#111111',
    icon: 'D80',
    description: '可折抵飲品 80 元，出示給店員確認。',
    couponLabel: '飲品折扣 80 元',
  },
  {
    id: 'points_100',
    name: '+100 積分',
    type: 'points',
    value: 100,
    weight: 25,
    color: '#111111',
    textColor: '#F4F4F0',
    icon: 'P100',
    description: '大獎！獲得 100 積分！',
  },
  {
    id: 'stamp_wheel',
    name: '限定印章',
    type: 'stamp',
    value: 0,
    weight: 10,
    color: '#111111',
    textColor: '#D4FF00',
    icon: 'ST',
    description: '稀有轉盤限定印章，集章任務加一！',
  },
  {
    id: 'coupon_dessert',
    name: '免費甜點券',
    type: 'coupon',
    value: 200,
    weight: 5,
    color: '#D4FF00',
    textColor: '#111111',
    icon: 'D200',
    description: '免費甜點一份！快點到店核銷。',
    couponLabel: '免費甜點兌換券',
  },
];

// ─── Utils ───

const TOTAL_WEIGHT = WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);

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
 * 檢查是否有免費扭蛋機會
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
