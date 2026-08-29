import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Star, RefreshCw, Gift, X, ArrowRight, ChevronRight, Coins, ShoppingBag, TrendingUp, LogIn, LogOut, MessageCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { hasSupabaseEnv, supabase, supabaseEnvWarning } from './src/lib/supabase';
import { getEconomyWallet, playDailyGacha } from './src/lib/economy';
import GameCard from './src/components/GameCard';
import LuckyWheel from './src/components/LuckyWheel';
import { sharePullToLine } from './src/lib/liffShare';
import { trackUserEvent } from './src/lib/eventTracker';
import { openPassportLogin, PASSPORT_AUTH_COMPLETE_EVENT } from './src/lib/authStorage';
import { trackUtmLanding, trackOutboundClick } from './src/lib/crossSiteTracking';
import { KiwimuButton, KiwimuToaster, kiwimuToast } from '@/components/kiwimu';

const trackGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, { site_id: 'gacha', ...params });
  }
};

// --- Assets & Data ---
const ASSETS = {
  mainImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-03_juymmq.webp",
  pitifulImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-04_mfdlsz.webp",
  instagramLink: "https://www.instagram.com/moon_moon_dessert/",
  passportUrl: "https://passport.kiwimu.com",
};

type DailyPrize = {
  id: string;
  label: string;
  points: number;
  color: string;
  border: string;
  glow: string;
};

// 純顯示樣式；獎勵點數與抽選機率只存在於伺服器規則。
const DAILY_PRIZE_PRESENTATIONS: Array<Omit<DailyPrize, 'points'>> = [
  { id: 'bronze', label: '銅球', color: 'bg-[#C9A46A]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'silver', label: '銀球', color: 'bg-[#E5E5E5]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'gold', label: '金球', color: 'bg-[#D4AF37]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'rainbow', label: '青球', color: 'bg-[#2A9D8F]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'lucky', label: '黑球', color: 'bg-[#111111]', border: 'border-[#D4FF00]', glow: 'shadow-lime-200' },
  { id: 'jackpot', label: '月光球', color: 'bg-[#D4FF00]', border: 'border-[#111111]', glow: 'shadow-lime-200' },
];

const DAILY_PRIZE_FALLBACK: Omit<DailyPrize, 'points'> = {
  id: 'kiwimu',
  label: 'Kiwimu 好運球',
  color: 'bg-[#D4FF00]',
  border: 'border-[#111111]',
  glow: 'shadow-lime-200',
};

const presentDailyPrize = (prizeCode: string, label: string, rewardPoints: number): DailyPrize => {
  const style = DAILY_PRIZE_PRESENTATIONS.find((prize) => prize.id === prizeCode) ?? DAILY_PRIZE_FALLBACK;
  return {
    ...style,
    id: prizeCode,
    label: label.trim().slice(0, 80) || style.label,
    points: rewardPoints,
  };
};

// 詩籤 Kiwimu Blessing (unchanged)
const FORTUNES = [
  { id: 1, level: "大吉", text: "新的一年，財神爺已經在你家門口排隊了。" },
  { id: 2, level: "中吉", text: "財源滾滾來，今年的紅包厚度會讓你笑出來。" },
  { id: 3, level: "大吉", text: "福星高照！不只吃甜點，連走在路上都會撿到錢。" },
  { id: 4, level: "吉", text: "好運來敲門，今天適合買張彩券試試手氣。" },
  { id: 5, level: "大吉", text: "事業步步高升，今年的戶頭數字將會直線上升。" },
  { id: 6, level: "中吉", text: "福氣滿滿，今年你將會收穫滿滿的善意與財富。" },
  { id: 7, level: "吉", text: "貴人相助，今年遇到什麼困難都能輕鬆迎刃而解。" },
  { id: 8, level: "小吉", text: "雖然是小吉，但積累的福氣足以讓你整年平安順遂。" },
  { id: 9, level: "大吉", text: "金銀財寶滿滿滿，今年的你就是行走的招財貓！" },
  { id: 10, level: "隱藏版", text: "Kiwimu 賜予你隱藏版好運，心想事成，萬事如意。" }
];

type Fortune = (typeof FORTUNES)[number];

const presentFortune = (metadata: Record<string, unknown>, prizeCode: string): Fortune => {
  const fortuneId = metadata.fortune_id;
  if (typeof fortuneId === 'number' && Number.isSafeInteger(fortuneId)) {
    const fortune = FORTUNES.find((candidate) => candidate.id === fortuneId);
    if (fortune) return fortune;
  }

  if (prizeCode === 'jackpot') {
    return {
      id: 999,
      level: '隱藏版',
      text: 'Kiwimu 極光降臨！這份伺服器核定的幸運非你莫屬。',
    };
  }

  return {
    id: 0,
    level: '吉',
    text: '今天的好運與獎勵已由 Kiwimu 安全記錄。',
  };
};

const economyErrorMessage = (code: string): string => {
  switch (code) {
    case 'AUTH_REQUIRED':
      return '請先登入 Passport，再進行每日搖珠。';
    case 'ROLLOUT_DISABLED':
      return '每日搖珠制度升級中，暫時不會產生或扣除任何積分。';
    case 'LIMIT_REACHED':
      return '今天的每日搖珠次數已用完。';
    default:
      return '每日搖珠暫時無法使用，請稍後再試。';
  }
};

// ─── Points Redemption Items (preview for the ticker) ───
const REDEEM_PREVIEW = [
  { name: '蕎麥茶', cost: 50 },
  { name: '冰美式', cost: 80 },
  { name: '西西里咖啡', cost: 100 },
  { name: '經典烤布丁', cost: 200 },
  { name: '戚風蛋糕', cost: 300 },
];

// --- Components ---

// 日式搖珠機 (Garapon) 動畫元件
const GaraponAnimation = ({ onClick, isSpinning, resultColor }: { onClick: () => void, isSpinning: boolean, resultColor?: string }) => {
  const controls = useAnimation();
  const drumControls = useAnimation();

  useEffect(() => {
    if (isSpinning) {
      const sequence = async () => {
        await controls.start({ x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.4 } });
        await drumControls.start({
          rotate: 360 * 3,
          transition: { duration: 2, ease: "easeInOut" }
        });
        drumControls.set({ rotate: 0 });
      };
      sequence();
    }
  }, [isSpinning, controls, drumControls]);

  useEffect(() => {
    if (!isSpinning) {
      controls.start({
        y: [0, -5, 0],
        transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
      });
      drumControls.start({
        rotate: 360,
        transition: { duration: 20, repeat: Infinity, ease: "linear" }
      });
    } else {
      controls.stop();
    }
  }, [isSpinning, controls, drumControls]);


  return (
    <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={isSpinning}
        aria-label="點擊轉蛋獲得月島積分"
        className="absolute inset-0 z-40 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4FF00] focus-visible:ring-offset-4 disabled:cursor-wait"
      />
      <motion.div
        className="pointer-events-none relative w-full h-full flex items-center justify-center"
        animate={controls}
      >
        {/* 點擊提示 */}
        {!isSpinning && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#111111] text-[#F4F4F0] text-[10px] font-bold px-2 py-1 rounded-md shadow-[2px_2px_0px_#D4FF00] whitespace-nowrap animate-pulse">
            一天一次・轉出積分好運
          </div>
        )}

        {/* Stand Base */}
        <div className="absolute bottom-0 w-32 h-4 bg-stone-800 rounded-lg z-10"></div>
        <div className="absolute bottom-2 left-10 w-4 h-24 bg-stone-800 -rotate-12 z-0"></div>
        <div className="absolute bottom-2 right-10 w-4 h-24 bg-stone-800 rotate-12 z-0"></div>

        {/* Rotating Hexagon Drum */}
        <motion.div
          className="relative w-32 h-32 z-10"
          animate={drumControls}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
            <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="#111111" stroke="#D4FF00" strokeWidth="2" />
            <path d="M6.7 25 L50 0 L50 100 L6.7 75 Z" fill="#D4FF00" fillOpacity="0.42" />
            <circle cx="50" cy="50" r="5" fill="#1C1917" />
          </svg>
        </motion.div>

        {/* Handle */}
        <motion.div
          className="absolute z-20"
          animate={drumControls}
        >
          <div className="w-1 h-12 bg-stone-400 origin-top translate-y-[-2px]"></div>
          <div className="w-3 h-3 bg-stone-900 rounded-full translate-x-[-4px] translate-y-10"></div>
        </motion.div>

        {/* Dropping Ball */}
        <AnimatePresence>
          {isSpinning && resultColor && resultColor !== "" && (
            <motion.div
              className={`absolute bottom-4 z-30 w-6 h-6 rounded-full ${resultColor} border-2 border-white shadow-md`}
              initial={{ y: 10, opacity: 0, scale: 0 }}
              animate={{
                y: [10, 60],
                x: [0, 20],
                opacity: [0, 1],
                scale: [0.5, 1.2]
              }}
              transition={{
                delay: 1.8,
                duration: 0.5,
                ease: "easeOut"
              }}
            />
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};

// 積分球獎池展示 + 兌換預告
const PointsPrizeTicker = () => (
  <div className="w-full mt-2 pb-2">
    <div className="flex items-center justify-between mb-3 px-2">
      <h3 className="kiwimu-mono text-[11px] font-bold text-[#666666] uppercase tracking-widest flex items-center gap-1">
        <Coins className="w-3 h-3" /> 積分獎池
      </h3>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-[#666666] font-medium">往右看可兌換品項</span>
        <ArrowRight className="w-3 h-3 text-[#666666]" />
      </div>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-6 px-4 snap-x snap-mandatory items-end pt-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Prize balls */}
      {DAILY_PRIZE_PRESENTATIONS.map((prize) => (
        <div key={prize.id} className="snap-center shrink-0 w-[100px] bg-[#FFFDF7] rounded-lg p-3 border-2 border-[#111111] shadow-[3px_3px_0px_#111111] flex flex-col items-center relative">
          <div className={`w-8 h-8 rounded-full ${prize.color} ${prize.border} border shadow-inner mb-2`}></div>
          <p className="font-bold text-[#111111] text-xs mb-0.5 text-center whitespace-nowrap">{prize.label}</p>
          <p className="text-[10px] text-[#666666] font-bold">伺服器抽選</p>
        </div>
      ))}

      {/* Divider */}
      <div className="snap-center shrink-0 w-[2px] h-16 bg-[#111111] self-center mx-1"></div>

      {/* Redeem preview */}
      {REDEEM_PREVIEW.map((item) => (
        <div key={item.name} className="snap-center shrink-0 w-[100px] bg-[#E5E5E5] rounded-lg p-3 border-2 border-dashed border-[#111111] flex flex-col items-center relative">
          <ShoppingBag className="w-6 h-6 text-[#111111] mb-2" />
          <p className="font-medium text-[#111111] text-xs mb-0.5 text-center whitespace-nowrap">{item.name}</p>
          <p className="text-[10px] text-[#666666] font-bold">{item.cost} 積分兌換</p>
        </div>
      ))}
    </div>
  </div>
);

// 點擊轉蛋後的結果 Modal：積分 + 運籤
const EventModal = ({ onClose, prize, fortune, isPlayedToday, totalPoints, onGoToStore, onShareResult }: {
  onClose: () => void,
  prize: DailyPrize,
  fortune: Fortune,
  isPlayedToday: boolean,
  totalPoints: number,
  onGoToStore: () => void,
  onShareResult: (message: string) => void
}) => {
  useEffect(() => {
    trackGtagEvent('result_viewed', {
      prize_id: prize.id,
      prize_label: prize.label,
      prize_points: prize.points,
    });
  }, [prize.id, prize.label, prize.points]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-[#111111]/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] bg-[#FFFDF7] rounded-xl shadow-[6px_6px_0px_#D4FF00] border-2 border-[#111111] overflow-hidden relative flex flex-col items-center"
      >
        <div className={`absolute top-0 w-full h-1.5 ${prize.points >= 100 ? 'bg-[#D4FF00]' : prize.points >= 25 ? 'bg-[#D4AF37]' : 'bg-[#111111]'} opacity-100`}></div>

        <div className="p-8 w-full flex flex-col items-center">
          {/* 1. Points Earned */}
          <div className="text-center mb-6 relative w-full">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full -z-10 opacity-40 ${prize.points >= 100 ? 'bg-[#D4FF00]' : prize.points >= 25 ? 'bg-[#D4AF37]' : 'bg-[#E5E5E5]'}`}></div>

            {/* Prize Ball */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, delay: 0.2 }}
              className={`w-14 h-14 rounded-full ${prize.color} ${prize.border} border-2 shadow-lg ${prize.glow} mx-auto mb-4`}
            ></motion.div>

            <p className="kiwimu-mono text-[11px] text-[#666666] mb-1 uppercase">reward unlocked</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4 }}
              className="kiwimu-heading text-3xl font-black text-[#111111] mb-1"
            >
              +{prize.points}
              <span className="text-lg ml-1">積分</span>
            </motion.p>
            <p className="text-xs text-[#666666]">{prize.label}</p>

            {/* Total Balance */}
            <div className="mt-4 bg-[#F4F4F0] rounded-lg px-4 py-2 inline-flex items-center gap-2 border border-[#111111]">
              <Coins className="w-4 h-4 text-[#111111]" />
              <span className="text-sm text-[#666666]">累計積分：</span>
              <span className="text-sm font-black text-[#111111]">{totalPoints}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-12 h-[2px] bg-[#111111] mb-6"></div>

          {/* 2. Fortune */}
          <div className="text-center mb-6">
            <span className={`inline-block px-4 py-1 rounded-md text-xs font-black tracking-[0.2em] mb-3 border-2 ${fortune.level === '隱藏版' ? 'bg-[#D4FF00] text-[#111111] border-[#111111]' :
              fortune.level === '大吉' ? 'bg-[#111111] text-[#F4F4F0] border-[#111111]' :
                fortune.level === '中吉' ? 'bg-[#D4AF37] text-[#111111] border-[#111111]' :
                  'bg-[#E5E5E5] text-[#111111] border-[#111111]'
              }`}>
              {fortune.level}
            </span>
            <p className="text-[#111111] font-serif font-medium text-base leading-relaxed tracking-wide px-2 italic">
              「{fortune.text}」
            </p>
          </div>

          {isPlayedToday && (
            <p className="text-xs text-[#666666] mb-4">( 這是您今天的運勢，明天再來轉喔！ )</p>
          )}

          {/* 3. Actions */}
          <div className="w-full flex flex-col gap-2">
            <KiwimuButton
              variant="line"
              size="md"
              className="w-full py-3"
              onClick={async () => {
                const result = await sharePullToLine(prize.label, prize.points);
                if (result.ok) {
                  onShareResult('已開啟 LINE 分享。');
                  return;
                }
                if ('message' in result) {
                  onShareResult(result.message);
                }
              }}
            >
              <MessageCircle className="w-4 h-4" />
              <span>跟 LINE 好友炫耀</span>
            </KiwimuButton>

            <KiwimuButton
              variant="accent"
              size="md"
              className="w-full py-3"
              onClick={onGoToStore}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>前往護照商店兌換</span>
            </KiwimuButton>

            <KiwimuButton
              variant="ghost"
              size="md"
              className="w-full py-3"
              onClick={onClose}
            >
              收下祝福
            </KiwimuButton>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main App ───
export default function App() {
  // Auth State
  const [authUser, setAuthUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthUser(null);
      return;
    }
    const sb = supabase;

    // 讀取 .kiwimu.com cookie session（跨網域共享）
    sb.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        sb.rpc('update_last_seen', { p_site: 'gacha' }).then(() => {});
        trackUserEvent('site_visited', {
          site_id: 'gacha',
          source: 'initial_session',
          path: window.location.pathname,
        });
      }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user && event === 'SIGNED_IN') {
        sb.rpc('update_last_seen', { p_site: 'gacha' }).then(() => {});
        trackUserEvent('site_visited', {
          site_id: 'gacha',
          source: 'auth_session',
          path: window.location.pathname,
        });
      }
    });

    const handlePassportAuthComplete = () => {
      void sb.auth.getSession().then(({ data: { session } }) => {
        setAuthUser(session?.user ?? null);
        if (session?.user) {
          sb.rpc('update_last_seen', { p_site: 'gacha' }).then(() => {});
          trackUserEvent('site_visited', {
            site_id: 'gacha',
            source: 'passport_popup',
            path: window.location.pathname,
          });
        }
      });
    };
    window.addEventListener(PASSPORT_AUTH_COMPLETE_EVENT, handlePassportAuthComplete);

    return () => {
      window.removeEventListener(PASSPORT_AUTH_COMPLETE_EVENT, handlePassportAuthComplete);
      subscription.unsubscribe();
    };
  }, []);

  const handlePassportLogin = () => {
    trackOutboundClick('https://passport.kiwimu.com', 'passport_login');
    openPassportLogin({
      intent: 'gacha_login',
      onError: (detail) => showTransientToast(detail.message || '登入失敗，請再試一次。'),
    });
  };
  const handleSignOut = async () => {
    if (!supabase) {
      setAuthUser(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setAuthUser(null);
      showTransientToast('已登出。');
    } catch (error) {
      console.error('Sign out failed', error);
      showTransientToast('登出失敗，請稍後再試。');
    }
  };

  // Wheel State
  const [showWheelModal, setShowWheelModal] = useState(false);

  // Gacha State
  const [showEventModal, setShowEventModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultPrize, setResultPrize] = useState<DailyPrize | null>(null);
  const [resultFortune, setResultFortune] = useState<Fortune | null>(null);
  const [isPlayedToday, setIsPlayedToday] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  const showTransientToast = (message: string) => {
    kiwimuToast(message);
  };

  // Load state
  useEffect(() => {
    trackGtagEvent('page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
    });
    trackUtmLanding();

    // GA4 duration tracking
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if ([10, 30, 60, 120, 300].includes(elapsed)) {
        trackGtagEvent('time_on_page', {
          event_category: 'Engagement',
          value: elapsed,
          event_label: `${elapsed}_seconds`,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (!authUser) {
      setTotalPoints(0);
      setIsPlayedToday(false);
      setResultPrize(null);
      setResultFortune(null);
      return () => {
        active = false;
      };
    }

    void getEconomyWallet().then((wallet) => {
      if (!active) return;
      if (wallet.ok && wallet.data) {
        // 0 是正式遠端餘額，不得回退到 localStorage。
        setTotalPoints(wallet.data.balance);
      } else {
        setTotalPoints(0);
      }
    });

    return () => {
      active = false;
    };
  }, [authUser]);

  const handleGachaClick = async () => {
    if (isSpinning) return;

    if (!authUser) {
      showTransientToast('請先登入 Passport，再進行每日搖珠。');
      handlePassportLogin();
      return;
    }

    setIsSpinning(true);
    const startedAt = Date.now();
    trackGtagEvent('spin_gacha', {
      event_category: 'Interaction',
      event_label: 'Start Spin',
      authority: 'server',
    });

    const response = await playDailyGacha();
    const isCommittedResult = response.ok || response.code === 'ALREADY_PROCESSED';
    if (!isCommittedResult || !response.data) {
      setIsSpinning(false);
      showTransientToast(economyErrorMessage(response.code));
      if (response.code === 'AUTH_REQUIRED') handlePassportLogin();
      return;
    }

    const selectedPrize = presentDailyPrize(
      response.data.outcome.prizeCode,
      response.data.outcome.label,
      response.data.rewardPoints,
    );
    const selectedFortune = presentFortune(
      response.data.outcome.metadata,
      response.data.outcome.prizeCode,
    );
    setResultPrize(selectedPrize);
    setResultFortune(selectedFortune);

    let authoritativeBalance = response.data.balance;
    if (authoritativeBalance === null) {
      const wallet = await getEconomyWallet();
      authoritativeBalance = wallet.ok && wallet.data ? wallet.data.balance : 0;
    }

    const remainingAnimationMs = Math.max(0, 2500 - (Date.now() - startedAt));
    window.setTimeout(() => {
      setIsSpinning(false);
      setShowEventModal(true);
      setIsPlayedToday(true);
      setTotalPoints(authoritativeBalance);

      trackGtagEvent('gacha_drawn', {
        prize_id: selectedPrize.id,
        prize_points: selectedPrize.points,
        prize_label: selectedPrize.label,
        response_code: response.code,
        authority: 'server',
      });
      trackUserEvent('gacha_played', {
        prize_id: selectedPrize.id,
        prize_label: selectedPrize.label,
        points_earned: selectedPrize.points,
        play_id: response.data?.playId,
        authority: 'server',
      });

      if (response.ok) {
        trackGtagEvent('reward_claimed', {
          reward_name: selectedPrize.label,
          value: selectedPrize.points,
          authority: 'server',
        });
      } else {
        showTransientToast('已載入今天由伺服器保存的搖珠結果。');
      }
    }, remainingAnimationMs);
  };

  const openPassportStore = (label: "Event Modal" | "Bottom Bar") => {
    trackGtagEvent('go_to_passport_store', {
      event_category: 'Conversion',
      event_label: label,
    });

    const url = ASSETS.passportUrl;

    trackOutboundClick(url, `passport_store:${label}`);
    showTransientToast('積分已由伺服器帳本同步，帶你前往 Passport。');

    const passportWindow = window.open(url, '_blank', 'noopener');
    if (!passportWindow) {
      window.location.href = url;
    }
  };

  const handleGoToStore = () => {
    openPassportStore("Event Modal");
  };

  const handleGoToStoreFromBar = () => {
    openPassportStore("Bottom Bar");
  };

  return (
    <div className="kiwimu-page-bg relative min-h-screen font-sans text-[#111111] overflow-x-hidden flex flex-col pb-24">

      {/* Auth 狀態浮動列 */}
      <div className="sticky top-0 z-50 flex min-h-10 justify-end border-b-2 border-[#111111] bg-[#F4F4F0]/90 px-4 py-2 backdrop-blur-sm">
        {authUser ? (
          <div className="flex items-center gap-2 text-xs text-[#111111]">
            <span className="truncate max-w-[120px]">{authUser.email?.split('@')[0]}</span>
            <button onClick={handleSignOut} className="flex items-center gap-1 text-[#666666] hover:text-[#111111] transition-colors">
              <LogOut size={13} /> 登出
            </button>
          </div>
        ) : !hasSupabaseEnv ? (
          <div className="text-[11px] text-[#666666] bg-[#E5E5E5] border border-[#111111] px-3 py-1.5 rounded-md">
            會員同步暫停中
          </div>
        ) : (
          <button onClick={handlePassportLogin} className="flex items-center gap-1.5 text-xs bg-[#111111] text-[#F4F4F0] px-3 py-1.5 rounded-md hover:bg-black transition-colors">
            <LogIn size={13} /> Google 登入
          </button>
        )}
      </div>

      {/* Background Pattern */}
      <main
        className="flex-grow w-full max-w-md mx-auto px-6 py-8 relative z-10 flex flex-col items-center"
        role="main"
        aria-label="月島遊戲中心"
      >
        {/* AI Semantic Context */}
        <section className="sr-only" aria-hidden="true">
          <h3>當前頁面核心功能</h3>
          <p>月島甜點事務所的遊戲中心，包含每日免費搖珠機、幸運轉盤，以及積分兌換甜點咖啡。</p>
        </section>

        {/* --- Header Section --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-6 w-full"
        >
          <div className="mb-4">
            <p className="ku-site-kicker">04 / Play &amp; fortune</p>
          </div>

          {/* Points Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-[#FFFDF7] rounded-lg px-4 py-2 shadow-[3px_3px_0px_#111111] border-2 border-[#111111] mb-3"
          >
            <Coins className="w-4 h-4 text-[#111111]" />
            <span className="text-sm font-bold text-[#111111]">我的積分</span>
            <span className="kiwimu-heading text-lg font-black text-[#111111]">{totalPoints}</span>
          </motion.div>

          <h2 className="kiwimu-heading text-2xl sm:text-3xl font-black tracking-widest text-[#111111] mb-1">
            月島・遊戲中心
          </h2>
          <p className="kiwimu-mono text-[#666666] text-[10px] sm:text-xs tracking-widest mb-5 uppercase">
            轉蛋賺積分・幸運轉盤花積分・換甜點
          </p>

          {/* 雙卡並列：搖珠機 + 轉盤 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <GameCard
              icon="01"
              title="每日搖珠機"
              subtitle="每日一次・伺服器抽選"
              badge={isPlayedToday ? '今日已轉' : '免費'}
              badgeVariant={isPlayedToday ? 'done' : 'free'}
              ctaLabel="轉一次"
              ctaDisabled={isSpinning}
              ctaDisabledLabel="轉動中..."
              accentColor="bg-[#D4FF00]"
              onClick={handleGachaClick}
            />
            <GameCard
              icon="02"
              title="幸運轉盤"
              subtitle="成本與獎池由規則核定"
              badge="新"
              badgeVariant="new"
              ctaLabel="轉一次"
              accentColor="bg-[#111111] text-[#F4F4F0]"
              onClick={() => setShowWheelModal(true)}
            />
          </div>

          {/* 搖珠機本體（保持功能，縮在這裡觸發） */}
          <div className="hidden">
            <GaraponAnimation
              onClick={handleGachaClick}
              isSpinning={isSpinning}
              resultColor={resultPrize?.color}
            />
          </div>

          <AnimatePresence>
            {showEventModal && resultPrize && resultFortune && (
              <EventModal
                onClose={() => setShowEventModal(false)}
                prize={resultPrize}
                fortune={resultFortune}
                isPlayedToday={isPlayedToday}
                totalPoints={totalPoints}
                onGoToStore={handleGoToStore}
                onShareResult={showTransientToast}
              />
            )}
          </AnimatePresence>

        {/* Prize Ticker */}
        <PointsPrizeTicker />

        {!hasSupabaseEnv && (
          <div className="mt-4 rounded-lg border-2 border-[#111111] bg-[#FFFDF7] px-4 py-3 text-left text-xs leading-6 text-[#111111] shadow-[3px_3px_0px_#D4FF00]">
            <div className="font-bold mb-1">雲端同步暫時停用</div>
            <div>{supabaseEnvWarning}</div>
            <div>為保護正式資產，設定修復前不會提供本地點數或離線發獎。</div>
          </div>
        )}
      </motion.div>

        {/* --- Info Card --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-[#FFFDF7] rounded-xl p-5 shadow-[4px_4px_0px_#111111] border-2 border-[#111111] mb-6 relative w-full"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#D4FF00] rounded-t-[10px]"></div>

          <div className="flex flex-col items-center w-full">
            {/* How it works */}
            <h3 className="kiwimu-heading text-sm font-black text-[#111111] mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#111111]" />
              積分攻略
            </h3>

            <div className="w-full space-y-3 text-sm text-[#111111]">
              <div className="flex items-start gap-3 bg-[#F4F4F0] rounded-lg p-3 border border-[#111111]/20">
                <Gift className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
                <div>
                  <p className="font-bold text-[#111111]">每日轉蛋</p>
                  <p className="text-xs text-[#666666]">每天一次免費轉蛋，積分直接入帳</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#F4F4F0] rounded-lg p-3 border border-[#111111]/20">
                <Star className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
                <div>
                  <p className="font-bold text-[#111111]">護照簽到</p>
                  <p className="text-xs text-[#666666]">連續簽到加成積分，7天/30天/100天里程碑</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-[#F4F4F0] rounded-lg p-3 border border-[#111111]/20">
                <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
                <div>
                  <p className="font-bold text-[#111111]">積分兌換</p>
                  <p className="text-xs text-[#666666]">到護照商店用積分兌換甜點、咖啡及周邊</p>
                </div>
              </div>
            </div>

            {/* Kiwimu character */}
            <div className="mt-4 flex items-end justify-center gap-3">
              <div className="relative bg-[#F4F4F0] border-2 border-[#111111] text-[#111111] text-[10px] px-3 py-2 rounded-lg rounded-br-none shadow-[3px_3px_0px_#D4FF00] max-w-[180px] text-right leading-relaxed">
                <p>
                  每天來轉轉好運，積分越多、離免費甜點越近。
                </p>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-14 h-14 shrink-0 relative top-1"
              >
                <img
                  src={ASSETS.pitifulImage}
                  alt="Kiwimu"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Phase 2 預留：我的 Kiwimu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="bg-[#E5E5E5] rounded-xl p-4 border-2 border-[#111111] border-dashed mb-6 w-full flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-lg bg-[#FFFDF7] border-2 border-[#111111] flex items-center justify-center text-sm font-black shrink-0">
            K
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="kiwimu-heading text-sm font-black text-[#111111]">我的 Kiwimu</h3>
              <span className="text-[10px] font-bold bg-[#FFFDF7] text-[#666666] border border-[#111111] px-2 py-0.5 rounded-md">即將推出</span>
            </div>
            <p className="text-[11px] text-[#666666] leading-tight">用積分解鎖背景、配件，收集 Bascat、Eggle 等夥伴角色</p>
          </div>
        </motion.div>

      </main>

      {/* 幸運轉盤 Modal */}
      <AnimatePresence>
        {showWheelModal && (
          <LuckyWheel
            onClose={() => setShowWheelModal(false)}
            onPointsChange={(newBalance) => setTotalPoints(newBalance)}
            onToast={showTransientToast}
            authenticated={Boolean(authUser)}
            balance={totalPoints}
            onLogin={handlePassportLogin}
          />
        )}
      </AnimatePresence>

      {/* --- Sticky Bottom Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#F4F4F0]/95 backdrop-blur-md border-t-2 border-[#111111] z-40 pb-8 sm:pb-4 safe-area-pb">
        {/* Step indicators */}
        <div className="max-w-md mx-auto w-full mb-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[#666666] text-center">
          <span className="text-[11px] font-medium">Step 1 遊戲賺積分</span>
          <ChevronRight className="w-3 h-3 text-[#111111] shrink-0" />
          <span className="text-[11px] font-medium">Step 2 轉盤花積分</span>
          <ChevronRight className="w-3 h-3 text-[#111111] shrink-0" />
          <span className="text-[11px] font-black text-[#111111]">Step 3 護照商店換甜點</span>
        </div>
        <div className="max-w-md mx-auto w-full flex gap-3">
          {/* Points display */}
          <KiwimuButton
            variant="default"
            size="lg"
            className="flex-1 py-3.5 px-4 cursor-default hover:bg-white"
            disabled
          >
            <Coins className="w-4 h-4 text-[#111111]" />
            <span className="text-sm">{totalPoints} 積分</span>
          </KiwimuButton>

          {/* Go to store */}
          <KiwimuButton
            variant="accent"
            size="lg"
            className="flex-[2] py-3.5 px-4"
            onClick={handleGoToStoreFromBar}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="text-sm tracking-wide">前往護照商店</span>
          </KiwimuButton>
        </div>
      </div>

      <KiwimuToaster />
    </div>
  );
}
