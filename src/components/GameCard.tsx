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
    <motion.div whileTap={{ scale: 0.98 }}>
      <KiwimuCard className="p-0 gap-0 relative overflow-hidden">
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`} />

        <KiwimuCardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-[#111111] bg-[#F4F4F0] text-xl">
                {icon}
              </span>
              <div>
                <h3 className="kiwimu-heading text-sm font-black text-[#111111] leading-tight">{title}</h3>
                <p className="text-[11px] text-[#666666] leading-tight mt-0.5">{subtitle}</p>
              </div>
            </div>
            {badge && (
              <KiwimuBadge variant={badgeVariant}>
                {badge}
              </KiwimuBadge>
            )}
          </div>

          <KiwimuButton
            variant={ctaDisabled ? 'ghost' : 'accent'}
            size="md"
            onClick={onClick}
            disabled={ctaDisabled}
            className={`w-full py-2.5 ${
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
