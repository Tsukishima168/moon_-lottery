/**
 * GameCard.tsx — 遊戲入口卡片
 * 搖珠機和轉盤共用的卡片 UI
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface GameCardProps {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaDisabledLabel?: string;
  accentColor?: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({
  icon,
  title,
  subtitle,
  badge,
  badgeColor = 'bg-stone-100 text-stone-500',
  ctaLabel,
  ctaDisabled = false,
  ctaDisabledLabel,
  accentColor = 'from-amber-500 to-orange-500',
  onClick,
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 shadow-md p-4 flex flex-col gap-3 relative overflow-hidden"
    >
      {/* 頂部色條 */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor} opacity-80`} />

      {/* 圖示 + 標題 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="text-sm font-black text-stone-800 leading-tight">{title}</h3>
            <p className="text-[11px] text-stone-500 leading-tight mt-0.5">{subtitle}</p>
          </div>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {/* CTA 按鈕 */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        disabled={ctaDisabled}
        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 transition-all ${
          ctaDisabled
            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
            : `bg-gradient-to-r ${accentColor} text-white shadow-sm`
        }`}
      >
        <span>{ctaDisabled && ctaDisabledLabel ? ctaDisabledLabel : ctaLabel}</span>
        {!ctaDisabled && <ChevronRight className="w-4 h-4" />}
      </motion.button>
    </motion.div>
  );
};

export default GameCard;
