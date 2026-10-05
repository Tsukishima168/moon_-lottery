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
  accentColor = 'bg-[#D4FF00]',
  onClick,
}) => {
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="h-full">
      <KiwimuCard className="h-full p-0 gap-0 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />

        <KiwimuCardContent className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-1">
            <span className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#111111] bg-[#F4F4F0] text-xl">
              {icon}
            </span>
            {badge && (
              <KiwimuBadge variant={badgeVariant} className="px-1 text-xs tracking-normal">
                {badge}
              </KiwimuBadge>
            )}
          </div>

          <div className="min-w-0">
            <h3 className="kiwimu-heading text-sm font-black text-[#111111] leading-snug">{title}</h3>
            <p className="text-xs text-[#666666] leading-relaxed mt-1">{subtitle}</p>
          </div>

          <KiwimuButton
            variant={ctaDisabled ? 'ghost' : 'accent'}
            size="md"
            onClick={onClick}
            disabled={ctaDisabled}
            className={`mt-auto w-full min-h-11 px-2 py-2.5 ${
              ctaDisabled
                ? 'bg-[#E5E5E5] text-[#666666] cursor-not-allowed'
                : accentColor
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
