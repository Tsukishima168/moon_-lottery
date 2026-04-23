/**
 * LuckyWheel.tsx — 幸運轉盤
 * 全螢幕 Modal：CSS conic-gradient 轉盤 + framer-motion 旋轉動畫 + 結果展示
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ChevronDown, ChevronUp, ShoppingBag, MessageCircle, RotateCcw } from 'lucide-react';
import { KiwimuButton } from '@/components/kiwimu';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  WHEEL_PRIZES,
  WHEEL_CONFIG,
  drawPrize,
  calculateTargetAngle,
  consumeFreeSpin,
  grantFreeSpin,
  grantDoubleCheckin,
  WheelPrize,
} from '../../wheelService';
import { getPointsBalance, addPoints, deductPoints } from '../../pointsSystem';
import { sharePullToLine } from '../lib/liffShare';

const trackGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

// ─── 轉盤本體 ───────────────────────────────────────────────

const SEGMENT_COUNT = WHEEL_PRIZES.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function buildConicGradient(): string {
  const parts = WHEEL_PRIZES.map((prize, i) => {
    const start = i * SEGMENT_ANGLE;
    const end = (i + 1) * SEGMENT_ANGLE;
    return `${prize.color} ${start}deg ${end}deg`;
  });
  return `conic-gradient(from 0deg, ${parts.join(', ')})`;
}

const WheelDisk: React.FC<{ rotation: number; isSpinning: boolean }> = ({ rotation, isSpinning }) => {
  return (
    <div className="relative w-64 h-64 mx-auto">
      {/* 指針（固定在頂部） */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
        <div
          className="w-0 h-0"
          style={{
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '20px solid #111111',
          }}
        />
      </div>

      {/* 轉盤本體 */}
      <motion.div
        className="w-full h-full rounded-full shadow-[6px_6px_0px_#111111] border-4 border-[#111111] relative overflow-hidden"
        style={{ background: buildConicGradient() }}
        animate={{ rotate: rotation }}
        transition={isSpinning ? { duration: 4, ease: [0.17, 0.67, 0.12, 0.99] } : { duration: 0 }}
      >
        {/* 扇形文字標籤 */}
        {WHEEL_PRIZES.map((prize, i) => {
          const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
          const rad = ((angle - 90) * Math.PI) / 180;
          const r = 88;
          const x = 128 + r * Math.cos(rad);
          const y = 128 + r * Math.sin(rad);
          return (
            <div
              key={prize.id}
              className="absolute pointer-events-none flex flex-col items-center"
              style={{
                left: x,
                top: y,
                transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                width: 52,
              }}
            >
              <span className="text-base leading-none">{prize.icon}</span>
              <span
                className="text-[9px] font-bold leading-tight text-center mt-0.5 whitespace-nowrap"
                style={{ color: prize.textColor }}
              >
                {prize.name}
              </span>
            </div>
          );
        })}
      </motion.div>

      {/* 中心圓 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#111111] border-4 border-[#D4FF00] shadow-lg z-10 flex items-center justify-center">
        <span className="text-[#F4F4F0] text-xs font-black">GO</span>
      </div>
    </div>
  );
};

// ─── 結果彈窗 ───────────────────────────────────────────────

const ResultModal: React.FC<{
  prize: WheelPrize;
  newBalance: number;
  isFreeSpin: boolean;
  hasEnoughForNextSpin: boolean;
  onSpinAgain: () => void;
  onClose: () => void;
  onShare: (msg: string) => void;
}> = ({ prize, newBalance, isFreeSpin, hasEnoughForNextSpin, onSpinAgain, onClose, onShare }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-[#111111]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] bg-[#FFFDF7] rounded-xl border-2 border-[#111111] shadow-[6px_6px_0px_#D4FF00] overflow-hidden"
      >
        {/* 頂部色條 */}
        <div className="h-1.5 w-full" style={{ background: prize.color }} />

        <div className="p-6 flex flex-col items-center">
          {/* 圖示 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            className="w-16 h-16 rounded-lg border-2 border-[#111111] flex items-center justify-center mb-3 text-4xl shadow-inner"
            style={{ background: prize.color }}
          >
            {prize.icon}
          </motion.div>

          <p className="kiwimu-mono text-[11px] text-[#666666] mb-1 uppercase">wheel reward</p>
          <h2 className="kiwimu-heading text-2xl font-black text-[#111111] mb-1">{prize.name}</h2>
          <p className="text-sm text-[#666666] text-center mb-4">{prize.description}</p>

          {/* coupon 類：額外顯示提示 */}
          {prize.type === 'coupon' && (
            <div className="w-full bg-[#F4F4F0] border-2 border-[#111111] rounded-lg px-4 py-3 mb-4 text-center">
              <p className="text-xs font-bold text-[#111111] mb-1">{prize.couponLabel}</p>
              <p className="text-[11px] text-[#666666]">請在店員面前出示此畫面核銷</p>
            </div>
          )}

          {/* 積分餘額 */}
          <div className="flex items-center gap-2 bg-[#F4F4F0] rounded-lg border border-[#111111] px-4 py-2 mb-5">
            <Coins className="w-4 h-4 text-[#111111]" />
            <span className="text-sm text-[#666666]">積分餘額：</span>
            <span className="text-sm font-black text-[#111111]">{newBalance}</span>
          </div>

          {/* CTA 群組 */}
          <div className="w-full flex flex-col gap-2">
            {/* 再轉一次 */}
            {(isFreeSpin || hasEnoughForNextSpin) && (
              <KiwimuButton
                variant="accent"
                size="md"
                className="w-full py-3"
                onClick={onSpinAgain}
              >
                <RotateCcw className="w-4 h-4" />
                {isFreeSpin ? '免費再轉一次！' : `再轉一次（${WHEEL_CONFIG.costPerSpin}P）`}
              </KiwimuButton>
            )}

            {/* LINE 分享 */}
            <KiwimuButton
              variant="line"
              size="md"
              className="w-full py-3"
              onClick={async () => {
                const result = await sharePullToLine(prize.name, prize.value);
                if (result.ok) {
                  onShare('已開啟 LINE 分享。');
                } else if ('message' in result) {
                  onShare(result.message);
                }
              }}
            >
              <MessageCircle className="w-4 h-4" />
              炫耀給 LINE 好友
            </KiwimuButton>

            <KiwimuButton
              variant="ghost"
              size="md"
              className="w-full py-3"
              onClick={onClose}
            >
              收下，繼續看
            </KiwimuButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── 主元件 ─────────────────────────────────────────────────

interface LuckyWheelProps {
  onClose: () => void;
  onPointsChange: (newBalance: number) => void;
  onToast: (msg: string) => void;
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onPointsChange, onToast }) => {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultPrize, setResultPrize] = useState<WheelPrize | null>(null);
  const [resultBalance, setResultBalance] = useState(0);
  const [isFreeSpin, setIsFreeSpin] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showPrizeList, setShowPrizeList] = useState(false);
  const currentBalance = getPointsBalance();
  const rotationRef = useRef(rotation);
  rotationRef.current = rotation;

  const canAfford = currentBalance >= WHEEL_CONFIG.costPerSpin;
  const hasFreeSpinBuff = !!localStorage.getItem(WHEEL_CONFIG.freeSpinBuffKey);

  const handleSpin = (freeSpinMode = false) => {
    if (isSpinning) return;

    const isFree = freeSpinMode || consumeFreeSpin();

    if (!isFree) {
      const result = deductPoints(WHEEL_CONFIG.costPerSpin, 'wheel_spend', '幸運轉盤消費');
      if (!result.success) {
        onToast('積分不足，無法轉盤！');
        return;
      }
      onPointsChange(result.newBalance);
    }

    setIsFreeSpin(isFree);
    setIsSpinning(true);
    setShowResult(false);

    trackGtagEvent('wheel_spin_start', { is_free: isFree });

    const { prize, prizeIndex } = drawPrize();
    const targetAngle = calculateTargetAngle(prizeIndex, rotationRef.current);

    setRotation(targetAngle);

    setTimeout(() => {
      setIsSpinning(false);

      let finalBalance = getPointsBalance();

      // 發獎
      if (prize.type === 'points') {
        const updated = addPoints(prize.value, 'wheel_earn', `轉盤獲得 ${prize.name}`);
        finalBalance = updated;
        onPointsChange(updated);
      } else if (prize.type === 'buff') {
        grantDoubleCheckin();
      } else if (prize.type === 'free_spin') {
        grantFreeSpin();
      }

      trackGtagEvent('wheel_spin_result', {
        prize_id: prize.id,
        prize_type: prize.type,
        prize_value: prize.value,
        is_free: isFree,
      });

      setResultPrize(prize);
      setResultBalance(finalBalance);
      setShowResult(true);
    }, 4200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="kiwimu-page-bg fixed inset-0 z-50 flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F4F4F0]/95 backdrop-blur-sm border-b-2 border-[#111111] flex items-center justify-between px-5 py-3">
        <div>
          <h2 className="kiwimu-heading text-base font-black text-[#111111]">幸運轉盤</h2>
          <p className="kiwimu-mono text-[11px] text-[#666666]">每次 {WHEEL_CONFIG.costPerSpin} 積分</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#FFFDF7] rounded-lg px-3 py-1.5 border-2 border-[#111111] shadow-[2px_2px_0px_#111111]">
            <Coins className="w-3.5 h-3.5 text-[#111111]" />
            <span className="text-sm font-black text-[#111111]">{currentBalance}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#FFFDF7] border-2 border-[#111111] flex items-center justify-center text-[#111111] hover:bg-[#E5E5E5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 轉盤區 */}
      <div className="flex-1 flex flex-col items-center justify-start px-5 pt-8 pb-6 max-w-md mx-auto w-full">
        {/* 轉盤本體 */}
        <div className="mb-8">
          <WheelDisk rotation={rotation} isSpinning={isSpinning} />
        </div>

        {/* CTA */}
        <KiwimuButton
          variant={isSpinning ? 'ghost' : (canAfford || hasFreeSpinBuff) ? 'accent' : 'ghost'}
          size="lg"
          onClick={() => handleSpin(false)}
          disabled={isSpinning || (!canAfford && !hasFreeSpinBuff)}
          className={`w-full max-w-xs py-4 rounded-lg font-black text-base mb-2 ${
            isSpinning
              ? 'bg-[#E5E5E5] text-[#666666] cursor-wait'
              : !(canAfford || hasFreeSpinBuff)
              ? 'bg-[#E5E5E5] text-[#666666] cursor-not-allowed'
              : ''
          }`}
        >
          {isSpinning ? (
            <span>轉動中...</span>
          ) : hasFreeSpinBuff ? (
            <>
              <span className="kiwimu-mono">FREE</span>
              <span>免費轉一次！</span>
            </>
          ) : canAfford ? (
            <>
              <span>轉一次</span>
              <span className="text-sm font-bold opacity-80">（{WHEEL_CONFIG.costPerSpin}P）</span>
            </>
          ) : (
            <span>積分不足（需 {WHEEL_CONFIG.costPerSpin}P）</span>
          )}
        </KiwimuButton>

        {!canAfford && !hasFreeSpinBuff && (
          <p className="text-xs text-[#666666] text-center mb-4">
            每日簽到或免費轉蛋可累積積分
          </p>
        )}

        {/* 獎品一覽（可收合） */}
        <Collapsible
          open={showPrizeList}
          onOpenChange={setShowPrizeList}
          className="w-full max-w-xs mt-2"
        >
          <CollapsibleTrigger
            className="w-full flex items-center justify-between text-xs text-[#666666] font-bold py-2 px-1 cursor-pointer"
          >
            <span>獎品機率一覽</span>
            {showPrizeList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="bg-[#FFFDF7] rounded-lg border-2 border-[#111111] divide-y divide-[#111111]/10">
              {WHEEL_PRIZES.map((prize) => (
                <div key={prize.id} className="flex items-center justify-between px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{prize.icon}</span>
                    <span className="text-xs font-medium text-[#111111]">{prize.name}</span>
                  </div>
                  <span className="text-[11px] text-[#666666] font-bold">
                    {((prize.weight / 1000) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* 結果 Modal */}
      <AnimatePresence>
        {showResult && resultPrize && (
          <ResultModal
            prize={resultPrize}
            newBalance={resultBalance}
            isFreeSpin={!!localStorage.getItem(WHEEL_CONFIG.freeSpinBuffKey)}
            hasEnoughForNextSpin={resultBalance >= WHEEL_CONFIG.costPerSpin}
            onSpinAgain={() => {
              setShowResult(false);
              handleSpin(false);
            }}
            onClose={() => setShowResult(false)}
            onShare={onToast}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default LuckyWheel;
