/** Presentation upgrade; existing prize weights, 30P cost and award handlers remain. */
import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Coins, Gift, MessageCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { WHEEL_PRIZES, WHEEL_CONFIG, drawPrize, consumeFreeSpin, grantFreeSpin, type WheelPrize } from '../../wheelService';
import { getPointsBalance, addPoints, deductPoints } from '../../pointsSystem';
import { sharePullToLine } from '../lib/liffShare';
import { GreenDialog } from './gacha/GreenDialog';

const DISPENSE_MS = 2600;
const trackGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, { site_id: 'gacha', ...params });
  }
};
function hasSavedFreeSpin(): boolean {
  try { return localStorage.getItem(WHEEL_CONFIG.freeSpinBuffKey) === 'true'; }
  catch { return false; }
}

function ResultModal({ prize, newBalance, onSpinAgain, onClose, onShare, returnFocusRef, returnFocusFallbackRef }: {
  prize: WheelPrize; newBalance: number; onSpinAgain: () => void; onClose: () => void;
  onShare: (message: string) => void; returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  returnFocusFallbackRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const [sharing, setSharing] = useState(false);
  const freeSpin = hasSavedFreeSpin();
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await sharePullToLine(prize.name, prize.value);
      onShare(result.ok ? '已開啟 LINE 分享。' : 'message' in result ? result.message : '暫時無法分享，請稍後再試。');
    } catch { onShare('暫時無法分享，請稍後再試。'); }
    finally { setSharing(false); }
  };
  return (
    <GreenDialog open nested title="這次的小驚喜" description="幸運轉盤的抽取結果" onClose={onClose} returnFocusRef={returnFocusRef} returnFocusFallbackRef={returnFocusFallbackRef}>
      <div className="gacha-wheel-result">
        <Gift size={38} aria-hidden="true" />
        <span className="gacha-tag">{prize.type === 'points' ? '本機遊戲積分' : prize.type === 'free_spin' ? '免費機會' : '獎品預覽'}</span>
        <h3>{prize.name}</h3><p>{prize.description}</p>
        {(prize.type === 'coupon' || prize.type === 'stamp') && <p className="gacha-small-story">這是獎品示意，實體兌換與會員集章尚未開放；不能以此畫面核銷。</p>}
        <div className="gacha-reward-line"><Coins size={18} aria-hidden="true" /><span>本機遊戲積分 <strong>{newBalance} P</strong></span></div>
        <div className="gacha-dialog-actions">
          <button type="button" className="gacha-button gacha-button-green" onClick={onClose}>收下，繼續逛 <ArrowRight size={18} aria-hidden="true" /></button>
          {(freeSpin || newBalance >= WHEEL_CONFIG.costPerSpin) && <button type="button" className="gacha-button gacha-button-outline" onClick={onSpinAgain}><RotateCcw size={18} aria-hidden="true" />{freeSpin ? '使用免費機會再轉一次' : `再轉一次（${WHEEL_CONFIG.costPerSpin}P）`}</button>}
          <button type="button" className="gacha-text-button" disabled={sharing} onClick={share}><MessageCircle size={18} aria-hidden="true" />{sharing ? '準備分享中…' : '分享給 LINE 好友'}</button>
        </div>
      </div>
    </GreenDialog>
  );
}

interface LuckyWheelProps {
  onClose: () => void;
  onPointsChange: (newBalance: number) => void;
  onToast: (message: string) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  dailyButtonRef: React.RefObject<HTMLButtonElement | null>;
  onGoToDaily: () => void;
}

const LuckyWheel: React.FC<LuckyWheelProps> = ({ onClose, onPointsChange, onToast, returnFocusRef, dailyButtonRef, onGoToDaily }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultPrize, setResultPrize] = useState<WheelPrize | null>(null);
  const [resultBalance, setResultBalance] = useState(0);
  const [isFreeSpin, setIsFreeSpin] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const spinButtonRef = useRef<HTMLButtonElement>(null);
  const wheelTitleRef = useRef<HTMLHeadingElement>(null);
  const exitFocusRef = useRef<HTMLElement | null>(returnFocusRef.current);
  const reduceMotion = useReducedMotion();
  const currentBalance = getPointsBalance();
  const canAfford = currentBalance >= WHEEL_CONFIG.costPerSpin;
  const hasFreeSpinBuff = hasSavedFreeSpin();

  const handleSpin = (freeSpinMode = false) => {
    if (isSpinning) return;

    const isFree = freeSpinMode || consumeFreeSpin();

    if (!isFree) {
      const result = deductPoints(WHEEL_CONFIG.costPerSpin, 'wheel_spend', '幸運轉盤消費');
      if (!result.success) {
        onToast('遊戲積分還不夠，先玩每日免費搖珠再來。');
        return;
      }
      onPointsChange(result.newBalance);
    }

    setIsFreeSpin(isFree);
    setIsSpinning(true);
    setShowResult(false);

    trackGtagEvent('wheel_spin_start', { is_free: isFree });

    const { prize } = drawPrize();

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
    <GreenDialog open wide title="幸運轉盤" description="一顆扭蛋，一份小驚喜。" onClose={onClose} closeDisabled={isSpinning} returnFocusRef={exitFocusRef} titleFocusRef={wheelTitleRef}>
      <div className="gacha-wheel-layout">
        <div className="gacha-wheel-art"><motion.img src="/assets/gacha-green/wheel-ed6e052bf4.webp" alt="綠色扭蛋機，裝著奶油白、森林綠與柔金色的小球。" width="1254" height="1254" animate={isSpinning && !reduceMotion ? { rotate: [0, -2, 2, 0] } : { rotate: 0 }} transition={{ duration: 0.7, repeat: isSpinning && !reduceMotion ? Infinity : 0 }} /></div>
        <div className="gacha-wheel-controls">
          <p className="gacha-eyebrow">02 / CAPSULE GAME</p><h3>想玩，就多轉一回。</h3>
          <p>每次使用 {WHEEL_CONFIG.costPerSpin} 本機遊戲積分。<br />開始前，先看看獎品與機率。</p>
          <div className="gacha-wheel-balance"><Coins size={18} aria-hidden="true" /><span>目前餘額</span><strong>{currentBalance} P</strong></div>
          <button type="button" className="gacha-button gacha-button-green" ref={spinButtonRef} onClick={() => handleSpin(false)} disabled={isSpinning || (!canAfford && !hasFreeSpinBuff)}>
            {isSpinning ? <><RefreshCw className="gacha-spinner" size={18} aria-hidden="true" />扭蛋正在轉動…</> : hasFreeSpinBuff ? <>免費轉一次 <ArrowRight size={18} aria-hidden="true" /></> : canAfford ? <>轉一次（{WHEEL_CONFIG.costPerSpin}P）<ArrowRight size={18} aria-hidden="true" /></> : <>還差 {WHEEL_CONFIG.costPerSpin - currentBalance}P，就能轉一次</>}
          </button>
          <p className="gacha-fine-print" role="status">{isSpinning ? '請稍候，結果揭曉後就能繼續操作。' : hasFreeSpinBuff ? '你有一次免費機會，這次不扣積分。' : canAfford ? '按下後立即扣除積分，再顯示抽取結果。' : '先收下每日免費搖珠的祝福，慢慢累積。'}</p>
          {!canAfford && !hasFreeSpinBuff && <button type="button" className="gacha-text-button" onClick={() => { exitFocusRef.current = dailyButtonRef.current; onGoToDaily(); }}>回到每日免費搖珠 <ArrowRight size={16} aria-hidden="true" /></button>}
        </div>
      </div>
      <details className="gacha-wheel-prizes"><summary>獎品與機率一覽 <span>10 種小驚喜</span></summary><div className="gacha-prize-list">{WHEEL_PRIZES.map((prize) => <div key={prize.id}><span>{prize.name}{(prize.type === 'coupon' || prize.type === 'stamp') && <small>預覽・尚未開放</small>}</span><strong>{(prize.weight / WHEEL_PRIZES.reduce((sum, item) => sum + item.weight, 0) * 100).toFixed(1)}%</strong></div>)}</div></details>
      <p className="gacha-fine-print gacha-wheel-disclaimer">本機遊戲積分與會員積分分開。券與印章為預覽，尚不能兌換或集章。</p>
      {showResult && resultPrize && <ResultModal prize={resultPrize} newBalance={resultBalance} onSpinAgain={() => { setShowResult(false); handleSpin(false); }} onClose={() => setShowResult(false)} onShare={onToast} returnFocusRef={spinButtonRef} returnFocusFallbackRef={wheelTitleRef} />}
    </GreenDialog>
  );
};
export default LuckyWheel;
