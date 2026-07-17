/**
 * 幸運轉盤的純顯示資料。
 *
 * 獎池、機率、成本與發獎全部由 Supabase 的 spin_reward_wheel RPC 決定；
 * 此檔案只把伺服器 prize_code 映射成動畫樣式，不具任何資產權威。
 */

export interface WheelPrizePresentation {
  id: string;
  name: string;
  color: string;
  textColor: string;
  icon: string;
  description: string;
  rewardPoints: number;
}

interface WheelStyle {
  color: string;
  textColor: string;
  icon: string;
}

const WHEEL_STYLES: Record<string, WheelStyle> = {
  points_5: { color: '#E5E5E5', textColor: '#111111', icon: 'P5' },
  points_10: { color: '#FFFDF7', textColor: '#111111', icon: 'P10' },
  points_20: { color: '#D9CBA3', textColor: '#111111', icon: 'P20' },
  points_25: { color: '#D4AF37', textColor: '#111111', icon: 'P25' },
  points_50: { color: '#C9A46A', textColor: '#111111', icon: 'P50' },
  points_100: { color: '#111111', textColor: '#F4F4F0', icon: 'P100' },
};

const FALLBACK_STYLE: WheelStyle = {
  color: '#D4FF00',
  textColor: '#111111',
  icon: 'K',
};

const safeLabel = (label: string): string => {
  const normalized = label.trim().slice(0, 80);
  return normalized || 'Kiwimu 幸運獎勵';
};

export function presentWheelPrize(
  prizeCode: string,
  label: string,
  rewardPoints: number,
): WheelPrizePresentation {
  const style = Object.prototype.hasOwnProperty.call(WHEEL_STYLES, prizeCode)
    ? WHEEL_STYLES[prizeCode]
    : FALLBACK_STYLE;
  const name = safeLabel(label);

  return {
    id: prizeCode,
    name,
    ...style,
    rewardPoints,
    description:
      rewardPoints > 0
        ? `伺服器已核發 ${rewardPoints} 積分。`
        : '本次結果已由伺服器記錄。',
  };
}

export const WHEEL_PRESENTATION_NOTICE =
  '成本、獎池與機率均由伺服器活動規則決定；每個帳號每日一次。';
