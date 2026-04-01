/**
 * GameCard.tsx — 遊戲入口卡片
 * 使用 Kiwimu 品牌積木重寫
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { KiwimuCard, KiwimuCardContent } from '@/components/kiwimu';
import { KiwimuButton } from '@/components/kiwimu';
import { KiwimuBadge } from '@/components/kiwimu';

interface GameCardProps {
  icon: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  badgeVariant?: 'free' | 'done' | 'new' | 'rare' | 'coming';
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
  badgeVariant = 'free',
  ctaLabel,
  ctaDisabled = false,
  ctaDisabledLabel,
  accentColor = 'from-amber-500 to-orange-500',
  onClick,
}) => {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <KiwimuCard className="p-0 gap-0 relative overflow-hidden">
        {/* 頂部色條 */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor} opacity-80`} />

        <KiwimuCardContent className="p-4 flex flex-col gap-3">
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
              <KiwimuBadge variant={badgeVariant}>
                {badge}
              </KiwimuBadge>
            )}
          </div>

          {/* CTA 按鈕 */}
          <KiwimuButton
            variant={ctaDisabled ? 'ghost' : 'accent'}
            size="md"
            onClick={onClick}
            disabled={ctaDisabled}
            className={`w-full py-2.5 ${
              ctaDisabled
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : `bg-gradient-to-r ${accentColor}`
            }`}
          >
            <span>{ctaDisabled && ctaDisabledLabel ? ctaDisabledLabel : ctaLabel}</span>
            {!ctaDisabled && <ChevronRight className="w-4 h-4" />}
          </KiwimuButton>
        </KiwimuCardContent>
      </KiwimuCard>
    </motion.div>
  );
};

export default GameCard;
