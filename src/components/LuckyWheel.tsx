/**
 * LuckyWheel.tsx — 扭蛋機
 * 全螢幕 Modal：framer-motion + CSS 扭蛋機（轉鈕 → 扭蛋掉落 → 結果展示）
 * 抽獎邏輯沿用 wheelService（drawPrize / 發獎 / 機率不變），僅替換前端揭曉呈現。
 * 注意：GA event 名稱（wheel_spin_*）刻意保留，維持分析資料連續性。
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ChevronDown, ChevronUp, MessageCircle, RotateCcw } from 'lucide-react';
import { KiwimuButton } from '@/components/kiwimu';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  WHEEL_PRIZES,
  WHEEL_CONFIG,
  drawPrize,
  consumeFreeSpin,
  grantFreeSpin,
  WheelPrize,
} from '../../wheelService';
import { getPointsBalance, addPoints, deductPoints } from '../../pointsSystem';
import { sharePullToLine } from '../lib/liffShare';

const trackGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, { site_id: 'gacha', ...params });
  }
};

// 扭蛋掉落動畫總時長（ms）— 與 handleSpin 的結果延遲對齊
const DISPENSE_MS = 2600;

// ─── 扭蛋機本體 ─────────────────────────────────────────────

// 玻璃罩內漂浮的扭蛋（品牌色，避免破壞黑白極簡視覺）
const DOME_CAPSULES = [
  { x: 34, y: 60, top: '#D4FF00' },
  { x: 92, y: 44, top: '#FFFDF7' },
  { x: 150, y: 62, top: '#E5E5E5' },
  { x: 60, y: 104, top: '#D4AF37' },
  { x: 118, y: 102, top: '#D4FF00' },
  { x: 92, y: 128, top: '#FFFDF7' },
];

const Capsule: React.FC<{ size: number; topColor: string }> = ({ size, topColor }) => (
  <div
    className="rounded-full border-2 border-[#111111] overflow-hidden relative shrink-0"
    style={{ width: size, height: size }}
  >
    <div className="absolute inset-x-0 top-0 h-1/2" style={{ background: topColor }} />
    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#FFFDF7]" />
    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#111111]/70" />
  </div>
);

const CapsuleMachine: React.FC<{ isSpinning: boolean; dispenseColor: string }> = ({
  isSpinning,
  dispenseColor,
}) => {
  return (
    <div className="relative w-64 h-[320px] mx-auto select-none">
      {/* ── 玻璃罩 ── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full border-4 border-[#111111] bg-gradient-to-b from-[#FFFFFF] to-[#F4F4F0] shadow-[5px_5px_0px_#111111] overflow-hidden">
        {/* 高光 */}
        <div className="absolute top-4 left-6 w-10 h-10 rounded-full bg-white/70 blur-[2px]" />
        {/* 罩內扭蛋 */}
        {DOME_CAPSULES.map((c, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: c.x, top: c.y }}
            animate={
              isSpinning
                ? { y: [0, -6, 4, -3, 0], x: [0, 3, -3, 2, 0], rotate: [0, 8, -8, 4, 0] }
                : { y: [0, -2, 0], rotate: [0, 2, 0] }
            }
            transition={{
              duration: isSpinning ? 0.5 : 2.4,
              repeat: Infinity,
              delay: i * 0.12,
              ease: 'easeInOut',
            }}
          >
            <Capsule size={26} topColor={c.top} />
          </motion.div>
        ))}
      </div>

      {/* ── 機身 ── */}
      <div className="absolute top-[176px] left-1/2 -translate-x-1/2 w-44 h-32 rounded-2xl bg-[#111111] shadow-[5px_5px_0px_#D4FF00] flex flex-col items-center pt-4">
        <span className="kiwimu-mono text-[10px] font-black tracking-[0.2em] text-[#D4FF00]">
          KIWIMU GACHA
        </span>

        {/* 轉鈕 */}
        <motion.div
          className="mt-2 w-12 h-12 rounded-full bg-[#D4FF00] border-4 border-[#FFFDF7] flex items-center justify-center"
          animate={{ rotate: isSpinning ? 720 : 0 }}
          transition={{ duration: DISPENSE_MS / 1000 - 0.6, ease: 'easeInOut' }}
        >
          <div className="relative w-5 h-5">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] bg-[#111111] rounded-full" />
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] bg-[#111111] rounded-full" />
          </div>
        </motion.div>

        {/* 出蛋口 */}
        <div className="mt-3 w-20 h-7 rounded-md bg-[#000000] border-2 border-[#333333]" />
      </div>

      {/* ── 接蛋盤 ── */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-6 rounded-b-xl bg-[#FFFDF7] border-2 border-[#111111] border-t-0" />

      {/* ── 掉落的扭蛋（僅轉動時出現）── */}
      <AnimatePresence>
        {isSpinning && (
          <motion.div
            className="absolute z-10"
            style={{ left: '50%', x: '-50%', top: 248 }}
            initial={{ y: -10, opacity: 0, scale: 0.5 }}
            animate={{
              y: [-10, 44, 30, 40, 36],
              opacity: [0, 1, 1, 1, 1],
              scale: [0.5, 1, 1, 1, 1],
            }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.2 } }}
            transition={{ duration: 1.5, delay: 0.7, times: [0, 0.55, 0.72, 0.88, 1], ease: 'easeOut' }}
          >
            <Capsule size={34} topColor={dispenseColor} />
          </motion.div>
        )}
      </AnimatePresence>
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
            className="kiwimu-mono w-16 h-16 rounded-lg border-2 border-[#111111] flex items-center justify-center mb-3 px-2 text-center text-xl font-black tracking-tight shadow-inner"
            style={{ background: prize.color }}
          >
            {prize.icon}
          </motion.div>

          <p className="kiwimu-mono text-[11px] text-[#666666] mb-1 uppercase">gacha capsule</p>
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
            {/* 再扭一次 */}
            {(isFreeSpin || hasEnoughForNextSpin) && (
              <KiwimuButton
                variant="accent"
                size="md"
                className="w-full py-3"
                onClick={onSpinAgain}
              >
                <RotateCcw className="w-4 h-4" />
                {isFreeSpin ? '免費再扭一次！' : `再扭一次（${WHEEL_CONFIG.costPerSpin}P）`}
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [dispenseColor, setDispenseColor] = useState('#D4FF00');
  const [resultPrize, setResultPrize] = useState<WheelPrize | null>(null);
  const [resultBalance, setResultBalance] = useState(0);
  const [isFreeSpin, setIsFreeSpin] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showPrizeList, setShowPrizeList] = useState(false);
  const currentBalance = getPointsBalance();

  const canAfford = currentBalance >= WHEEL_CONFIG.costPerSpin;
  const hasFreeSpinBuff = !!localStorage.getItem(WHEEL_CONFIG.freeSpinBuffKey);

  const handleSpin = (freeSpinMode = false) => {
    if (isSpinning) return;

    const isFree = freeSpinMode || consumeFreeSpin();

    if (!isFree) {
      const result = deductPoints(WHEEL_CONFIG.costPerSpin, 'wheel_spend', '幸運轉盤消費');
      if (!result.success) {
        onToast('積分不足，無法扭蛋！');
        return;
      }
      onPointsChange(result.newBalance);
    }

    setIsFreeSpin(isFree);
    setIsSpinning(true);
    setShowResult(false);

    trackGtagEvent('wheel_spin_start', { is_free: isFree });

    const { prize } = drawPrize();
    // 掉落的扭蛋顏色反映獎品（白色獎品改用 lime，避免在淺背景上看不見）
    setDispenseColor(prize.color === '#FFFDF7' ? '#D4FF00' : prize.color);

    setTimeout(() => {
      setIsSpinning(false);

      let finalBalance = getPointsBalance();

      // 發獎
      if (prize.type === 'points') {
        const updated = addPoints(prize.value, 'wheel_earn', `扭蛋獲得 ${prize.name}`);
        finalBalance = updated;
        onPointsChange(updated);
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
    }, DISPENSE_MS);
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
          <h2 className="kiwimu-heading text-base font-black text-[#111111]">扭蛋機</h2>
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

      {/* 扭蛋機區 */}
      <div className="flex-1 flex flex-col items-center justify-start px-5 pt-8 pb-6 max-w-md mx-auto w-full">
        {/* 扭蛋機本體 */}
        <div className="mb-8">
          <CapsuleMachine isSpinning={isSpinning} dispenseColor={dispenseColor} />
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
            <span>扭蛋中...</span>
          ) : hasFreeSpinBuff ? (
            <>
              <span className="kiwimu-mono">FREE</span>
              <span>免費扭一次！</span>
            </>
          ) : canAfford ? (
            <>
              <span>扭一次</span>
              <span className="text-sm font-bold opacity-80">（{WHEEL_CONFIG.costPerSpin}P）</span>
            </>
          ) : (
            <span>積分不足（需 {WHEEL_CONFIG.costPerSpin}P）</span>
          )}
        </KiwimuButton>

        {!canAfford && !hasFreeSpinBuff && (
          <p className="text-xs text-[#666666] text-center mb-4">
            每日簽到或免費扭蛋可累積積分
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
                    <span className="kiwimu-mono min-w-10 rounded border border-[#111111]/20 bg-[#F4F4F0] px-1.5 py-0.5 text-center text-[10px] font-black text-[#111111]">
                      {prize.icon}
                    </span>
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
