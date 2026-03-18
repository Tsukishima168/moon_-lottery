/**
 * LuckyWheel.tsx — 幸運轉盤
 * 全螢幕 Modal：CSS conic-gradient 轉盤 + framer-motion 旋轉動畫 + 結果展示
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ChevronDown, ChevronUp, ShoppingBag, MessageCircle, RotateCcw } from 'lucide-react';
import {
  WHEEL_PRIZES,
  WHEEL_CONFIG,
  drawPrize,
  calculateTargetAngle,
  consumeFreeSpin,
  grantFreeSpin,
  grantDoubleCheckin,
  WheelPrize,
} from '../wheelService';
import { getPointsBalance, addPoints, deductPoints } from '../pointsSystem';
import { sharePullToLine } from '../src/lib/liffShare';

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
            borderTop: '20px solid #1C1917',
          }}
        />
      </div>

      {/* 轉盤本體 */}
      <motion.div
        className="w-full h-full rounded-full shadow-xl border-4 border-stone-800 relative overflow-hidden"
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900 border-4 border-white shadow-lg z-10 flex items-center justify-center">
        <span className="text-white text-xs font-black">GO</span>
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-stone-900/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* 頂部色條 */}
        <div className="h-1.5 w-full" style={{ background: prize.color }} />

        <div className="p-6 flex flex-col items-center">
          {/* 圖示 */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3 text-4xl shadow-inner"
            style={{ background: prize.color }}
          >
            {prize.icon}
          </motion.div>

          <p className="text-xs text-stone-400 mb-1">恭喜獲得</p>
          <h2 className="text-2xl font-black text-stone-900 mb-1">{prize.name}</h2>
          <p className="text-sm text-stone-500 text-center mb-4">{prize.description}</p>

          {/* coupon 類：額外顯示提示 */}
          {prize.type === 'coupon' && (
            <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-center">
              <p className="text-xs font-bold text-amber-700 mb-1">{prize.couponLabel}</p>
              <p className="text-[11px] text-amber-600">請在店員面前出示此畫面核銷</p>
            </div>
          )}

          {/* 積分餘額 */}
          <div className="flex items-center gap-2 bg-stone-50 rounded-full px-4 py-2 mb-5">
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm text-stone-600">積分餘額：</span>
            <span className="text-sm font-black text-stone-800">{newBalance}</span>
          </div>

          {/* CTA 群組 */}
          <div className="w-full flex flex-col gap-2">
            {/* 再轉一次 */}
            {(isFreeSpin || hasEnoughForNextSpin) && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onSpinAgain}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md"
              >
                <RotateCcw className="w-4 h-4" />
                {isFreeSpin ? '免費再轉一次！' : `再轉一次（${WHEEL_CONFIG.costPerSpin}P）`}
              </motion.button>
            )}

            {/* LINE 分享 */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={async () => {
                const result = await sharePullToLine(prize.name, prize.value);
                if (result.ok) {
                  onShare('已開啟 LINE 分享。');
                } else if ('message' in result) {
                  onShare(result.message);
                }
              }}
              className="w-full py-3 bg-[#06C755] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              炫耀給 LINE 好友
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm"
            >
              收下，繼續看
            </motion.button>
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
      className="fixed inset-0 z-50 bg-[#F9F8F2] flex flex-col overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#F9F8F2]/95 backdrop-blur-sm border-b border-stone-200 flex items-center justify-between px-5 py-3">
        <div>
          <h2 className="text-base font-black text-stone-900">幸運轉盤</h2>
          <p className="text-[11px] text-stone-500">每次 {WHEEL_CONFIG.costPerSpin} 積分</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-stone-200 shadow-sm">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm font-black text-stone-800">{currentBalance}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors"
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
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSpin(false)}
          disabled={isSpinning || (!canAfford && !hasFreeSpinBuff)}
          className={`w-full max-w-xs py-4 rounded-2xl font-black text-base shadow-lg transition-all flex items-center justify-center gap-2 mb-2 ${
            isSpinning
              ? 'bg-stone-200 text-stone-400 cursor-wait'
              : canAfford || hasFreeSpinBuff
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200'
              : 'bg-stone-100 text-stone-400 cursor-not-allowed'
          }`}
        >
          {isSpinning ? (
            <span>轉動中...</span>
          ) : hasFreeSpinBuff ? (
            <>
              <span>🎡</span>
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
        </motion.button>

        {!canAfford && !hasFreeSpinBuff && (
          <p className="text-xs text-stone-400 text-center mb-4">
            每日簽到或免費轉蛋可累積積分
          </p>
        )}

        {/* 獎品一覽（可收合） */}
        <div className="w-full max-w-xs mt-2">
          <button
            onClick={() => setShowPrizeList((v) => !v)}
            className="w-full flex items-center justify-between text-xs text-stone-500 font-bold py-2 px-1"
          >
            <span>獎品機率一覽</span>
            {showPrizeList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showPrizeList && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-xl border border-stone-100 divide-y divide-stone-50">
                  {WHEEL_PRIZES.map((prize) => (
                    <div key={prize.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{prize.icon}</span>
                        <span className="text-xs font-medium text-stone-700">{prize.name}</span>
                      </div>
                      <span className="text-[11px] text-stone-400 font-bold">
                        {((prize.weight / 1000) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
