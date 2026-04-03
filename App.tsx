import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Star, RefreshCw, Gift, X, ArrowRight, ChevronRight, Coins, ShoppingBag, TrendingUp, LogIn, LogOut, MessageCircle } from 'lucide-react';
import { getDeviceId, getPointsBalance, addPoints, buildPassportSyncUrl, consumePassportSyncAck, getPendingPassportSync, PointAction } from './pointsSystem';
import { hasSupabaseEnv, supabase, supabaseEnvWarning } from './src/lib/supabase';
import GameCard from './src/components/GameCard';
import LuckyWheel from './src/components/LuckyWheel';
import { sharePullToLine } from './src/lib/liffShare';
import { trackUserEvent } from './src/lib/eventTracker';
import { KiwimuButton, KiwimuToaster, kiwimuToast } from '@/components/kiwimu';

const trackGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
};

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to read localStorage key: ${key}`, error);
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error(`Failed to write localStorage key: ${key}`, error);
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key: ${key}`, error);
  }
};

// --- Assets & Data ---
const ASSETS = {
  mainImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-03_juymmq.webp",
  pitifulImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-04_mfdlsz.webp",
  instagramLink: "https://www.instagram.com/moon_moon_dessert/",
  passportUrl: "https://passport.kiwimu.com",
};

// ─── Points Prize Pool (replaces physical prizes) ───
const POINT_PRIZES = [
  { id: 'bronze', label: '銅球', points: 5, weight: 45, color: 'bg-amber-700', border: 'border-amber-800', glow: 'shadow-amber-200' },
  { id: 'silver', label: '銀球', points: 10, weight: 30, color: 'bg-slate-300', border: 'border-slate-400', glow: 'shadow-slate-200' },
  { id: 'gold', label: '金球', points: 25, weight: 15, color: 'bg-yellow-400', border: 'border-yellow-500', glow: 'shadow-yellow-200' },
  { id: 'rainbow', label: '彩虹球', points: 50, weight: 5, color: 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400', border: 'border-pink-500', glow: 'shadow-pink-200' },
  { id: 'lucky', label: '幸運球', points: 100, weight: 3, color: 'bg-red-500', border: 'border-red-600', glow: 'shadow-red-200' },
  { id: 'jackpot', label: '極光球', points: 200, weight: 2, color: 'bg-emerald-400', border: 'border-emerald-500', glow: 'shadow-emerald-200' },
];

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
        className="absolute inset-0 z-40 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-4 disabled:cursor-wait"
      />
      <motion.div
        className="pointer-events-none relative w-full h-full flex items-center justify-center"
        animate={controls}
      >
        {/* 點擊提示 */}
        {!isSpinning && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md whitespace-nowrap animate-pulse">
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
            <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="#B91C1C" stroke="#991B1B" strokeWidth="2" />
            <path d="M6.7 25 L50 0 L50 100 L6.7 75 Z" fill="#F59E0B" fillOpacity="0.2" />
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
      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
        <Coins className="w-3 h-3" /> 積分獎池
      </h3>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-stone-400 font-medium">往右看可兌換品項</span>
        <ArrowRight className="w-3 h-3 text-stone-400" />
      </div>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-6 px-4 snap-x snap-mandatory items-end pt-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {/* Prize balls */}
      {POINT_PRIZES.map((prize) => (
        <div key={prize.id} className={`snap-center shrink-0 w-[100px] bg-white rounded-xl p-3 border ${prize.points >= 100 ? 'border-amber-400 shadow-md ring-1 ring-amber-100' : 'border-stone-100 shadow-sm'} flex flex-col items-center relative`}>
          {prize.points >= 100 && (
            <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg shadow-sm">稀有</div>
          )}
          <div className={`w-8 h-8 rounded-full ${prize.color} ${prize.border} border shadow-inner mb-2`}></div>
          <p className="font-bold text-stone-800 text-xs mb-0.5 text-center whitespace-nowrap">{prize.label}</p>
          <p className="text-[10px] text-amber-600 font-bold">+{prize.points} 積分</p>
        </div>
      ))}

      {/* Divider */}
      <div className="snap-center shrink-0 w-[1px] h-16 bg-stone-200 self-center mx-1"></div>

      {/* Redeem preview */}
      {REDEEM_PREVIEW.map((item) => (
        <div key={item.name} className="snap-center shrink-0 w-[100px] bg-stone-50 rounded-xl p-3 border border-dashed border-stone-300 flex flex-col items-center relative">
          <ShoppingBag className="w-6 h-6 text-stone-400 mb-2" />
          <p className="font-medium text-stone-600 text-xs mb-0.5 text-center whitespace-nowrap">{item.name}</p>
          <p className="text-[10px] text-red-600 font-bold">{item.cost} 積分兌換</p>
        </div>
      ))}
    </div>
  </div>
);

// 點擊轉蛋後的結果 Modal：積分 + 運籤
const EventModal = ({ onClose, prize, fortune, isPlayedToday, totalPoints, onGoToStore, onShareResult }: {
  onClose: () => void,
  prize: typeof POINT_PRIZES[0],
  fortune: typeof FORTUNES[0],
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
      className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-stone-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 10, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[320px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden relative flex flex-col items-center"
      >
        {/* Card Top Accent */}
        <div className={`absolute top-0 w-full h-1.5 bg-gradient-to-r ${prize.points >= 100 ? 'from-amber-400 via-yellow-300 to-amber-500' : prize.points >= 25 ? 'from-yellow-400 via-amber-300 to-yellow-400' : 'from-red-800 via-red-600 to-red-800'} opacity-90`}></div>

        <div className="p-8 w-full flex flex-col items-center">
          {/* 1. Points Earned */}
          <div className="text-center mb-6 relative w-full">
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl -z-10 opacity-60 ${prize.points >= 100 ? 'bg-amber-100' : prize.points >= 25 ? 'bg-yellow-50' : 'bg-red-50'}`}></div>

            {/* Prize Ball */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 10, delay: 0.2 }}
              className={`w-14 h-14 rounded-full ${prize.color} ${prize.border} border-2 shadow-lg ${prize.glow} mx-auto mb-4`}
            ></motion.div>

            <p className="text-xs text-stone-400 mb-1">恭喜獲得</p>
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4 }}
              className="text-3xl font-black text-amber-600 mb-1"
            >
              +{prize.points}
              <span className="text-lg ml-1">積分</span>
            </motion.p>
            <p className="text-xs text-stone-500">{prize.label}</p>

            {/* Total Balance */}
            <div className="mt-4 bg-stone-50 rounded-lg px-4 py-2 inline-flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-stone-600">累計積分：</span>
              <span className="text-sm font-bold text-stone-800">{totalPoints}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="w-12 h-[1px] bg-stone-200 mb-6"></div>

          {/* 2. Fortune */}
          <div className="text-center mb-6">
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] mb-3 border ${fortune.level === '隱藏版' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              fortune.level === '大吉' ? 'bg-red-50 text-red-800 border-red-200' :
                fortune.level === '中吉' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-stone-50 text-stone-600 border-stone-200'
              }`}>
              {fortune.level}
            </span>
            <p className="text-stone-600 font-serif font-medium text-base leading-relaxed tracking-wide px-2 italic">
              「{fortune.text}」
            </p>
          </div>

          {isPlayedToday && (
            <p className="text-xs text-stone-400 mb-4">( 這是您今天的運勢，明天再來轉喔！ )</p>
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
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthUser(null);
      return;
    }

    // 讀取 .kiwimu.com cookie session（跨網域共享）
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthUser(session?.user ?? null);
      if (session?.user) {
        supabase.rpc('update_last_seen', { p_site: 'gacha' }).then(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = () => {
    // 統一走 Passport 登入中心（SSO）
    const redirectTo = encodeURIComponent(window.location.origin);
    window.location.href = `https://passport.kiwimu.com?redirect_to=${redirectTo}`;
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
  const [resultPrize, setResultPrize] = useState<typeof POINT_PRIZES[0] | null>(null);
  const [resultFortune, setResultFortune] = useState<typeof FORTUNES[0] | null>(null);
  const [isPlayedToday, setIsPlayedToday] = useState(false);
  const [todayResultUnavailable, setTodayResultUnavailable] = useState(false);
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

    // Initialize device ID
    getDeviceId();

    // Load points balance
    setTotalPoints(getPointsBalance());

    // Check if played today
    const today = new Date().toLocaleDateString();
    const lastPlayed = safeStorageGet('moonmoon_gacha_last_played');

    if (lastPlayed === today) {
      setIsPlayedToday(true);
      setTodayResultUnavailable(false);
      const savedResult = safeStorageGet('moonmoon_gacha_today_result');
      if (savedResult) {
        try {
          const parsed = JSON.parse(savedResult);
          if (parsed.prizeId && parsed.fortuneId) {
            const prize = POINT_PRIZES.find(p => p.id === parsed.prizeId) || POINT_PRIZES[0];
            const fortune = FORTUNES.find(f => f.id === parsed.fortuneId) || FORTUNES[0];
            setResultPrize(prize);
            setResultFortune(fortune);
          } else {
            safeStorageRemove('moonmoon_gacha_today_result');
            setTodayResultUnavailable(true);
          }
        } catch (e) {
          console.warn('Failed to parse saved result, clearing corrupted cache.', e);
          safeStorageRemove('moonmoon_gacha_today_result');
          setTodayResultUnavailable(true);
        }
      } else {
        setTodayResultUnavailable(true);
      }
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const processPassportSyncAck = () => {
      const ackTimestamp = consumePassportSyncAck();
      if (ackTimestamp) {
        showTransientToast('Passport 已確認同步這次積分。');
      }
    };

    processPassportSyncAck();

    const handleFocus = () => processPassportSyncAck();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processPassportSyncAck();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleGachaClick = () => {
    if (isSpinning) return;

    if (isPlayedToday) {
      if (resultPrize && resultFortune) {
        trackGtagEvent('view_today_result', {
          event_category: 'Interaction',
          event_label: 'View Today\'s Result',
        });
        setShowEventModal(true);
        return;
      }

      if (todayResultUnavailable) {
        showTransientToast('今天已抽過，但今日結果讀取失敗；請重新整理後再查看。');
        return;
      }
    }

    // Start spin
    setIsSpinning(true);
    trackGtagEvent('spin_gacha', {
      event_category: 'Interaction',
      event_label: 'Start Spin',
    });

    // Weighted random selection
    const totalWeight = POINT_PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let selectedPrize = POINT_PRIZES[0];

    for (const prize of POINT_PRIZES) {
      if (randomVal < prize.weight) {
        selectedPrize = prize;
        break;
      }
      randomVal -= prize.weight;
    }

    // Random fortune
    let randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];

    // Jackpot override
    if (selectedPrize.id === 'jackpot') {
      randomFortune = {
        ...randomFortune,
        id: 999,
        level: "隱藏版",
        text: "Kiwimu 極光降臨！這份幸運非你莫屬，200 積分直達帳戶！"
      };
    }

    setResultPrize(selectedPrize);
    setResultFortune(randomFortune);

    // Wait for animation, then show result
    setTimeout(() => {
      setIsSpinning(false);
      setShowEventModal(true);
      setIsPlayedToday(true);
      setTodayResultUnavailable(false);

      // GA4: gacha_drawn — 結果揭曉
      trackGtagEvent('gacha_drawn', {
        prize_id: selectedPrize.id,
        prize_points: selectedPrize.points,
        prize_label: selectedPrize.label,
      });
      trackUserEvent('gacha_played', {
        prize_id: selectedPrize.id,
        prize_label: selectedPrize.label,
        points_earned: selectedPrize.points,
      });

      // Award points
      const newBalance = addPoints(selectedPrize.points, 'gacha_earn', `扭蛋獲得 ${selectedPrize.label}`);
      setTotalPoints(newBalance);
      trackGtagEvent('reward_claimed', {
        reward_name: selectedPrize.label,
      });

      // 🎮 LIFF-4：廣播積分事件給 Passport（跨站同步）
      document.dispatchEvent(new CustomEvent('kiwimu:points_earned', {
        detail: {
          points: selectedPrize.points,
          action: 'gacha_earn' as PointAction,
          description: `扭蛋獲得 ${selectedPrize.label} +${selectedPrize.points} 積分`,
          source: 'gacha',
        },
        bubbles: true,
      }));

      // GA4 track
      trackGtagEvent('points_earned', {
        event_category: 'Points',
        value: selectedPrize.points,
        event_label: selectedPrize.label,
      });

      // Save today's result
      const today = new Date().toLocaleDateString();
      safeStorageSet('moonmoon_gacha_last_played', today);
      safeStorageSet('moonmoon_gacha_today_result', JSON.stringify({
        prizeId: selectedPrize.id,
        fortuneId: randomFortune.id
      }));

    }, 2500);
  };

  const openPassportStore = (label: "Event Modal" | "Bottom Bar") => {
    trackGtagEvent('go_to_passport_store', {
      event_category: 'Conversion',
      event_label: label,
    });

    const pendingSync = getPendingPassportSync();
    const url = pendingSync
      ? buildPassportSyncUrl(ASSETS.passportUrl, pendingSync.amount, 'gacha', pendingSync.latestTimestamp)
      : ASSETS.passportUrl;

    if (pendingSync) {
      showTransientToast(`準備同步 ${pendingSync.amount} 積分到 Passport。`);
    } else {
      showTransientToast('目前沒有新的 Gacha 積分待同步，直接帶你前往 Passport。');
    }

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
    <div className="relative min-h-screen font-sans text-stone-800 selection:bg-red-200 overflow-x-hidden bg-[#F9F8F2] flex flex-col pb-24">

      {/* Auth 狀態浮動列 */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-end px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-stone-100">
        {authUser ? (
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="truncate max-w-[120px]">{authUser.email?.split('@')[0]}</span>
            <button onClick={handleSignOut} className="flex items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors">
              <LogOut size={13} /> 登出
            </button>
          </div>
        ) : !hasSupabaseEnv ? (
          <div className="text-[11px] text-stone-500 bg-stone-100 px-3 py-1.5 rounded-full">
            會員同步暫停中
          </div>
        ) : (
          <button onClick={handleGoogleLogin} className="flex items-center gap-1.5 text-xs bg-stone-800 text-white px-3 py-1.5 rounded-full hover:bg-stone-700 transition-colors">
            <LogIn size={13} /> Google 登入
          </button>
        )}
      </div>
      {/* Auth 列佔位 */}
      <div className="h-10" />

      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}
      />

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
          {/* Points Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-full px-4 py-2 shadow-sm border border-stone-100 mb-3"
          >
            <Coins className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-stone-700">我的積分</span>
            <span className="text-lg font-black text-amber-600">{totalPoints}</span>
          </motion.div>

          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-stone-900 mb-1">
            月島・遊戲中心
          </h2>
          <p className="text-stone-500 text-[10px] sm:text-xs tracking-wide mb-5">
            轉蛋賺積分・幸運轉盤花積分・換甜點
          </p>

          {/* 雙卡並列：搖珠機 + 轉盤 */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <GameCard
              icon="🎰"
              title="每日搖珠機"
              subtitle="免費賺 5~200 積分"
              badge={isPlayedToday ? '今日已轉' : '免費'}
              badgeVariant={isPlayedToday ? 'done' : 'free'}
              ctaLabel="轉一次"
              ctaDisabled={isSpinning}
              ctaDisabledLabel="轉動中..."
              accentColor="from-red-700 to-red-500"
              onClick={handleGachaClick}
            />
            <GameCard
              icon="🎡"
              title="幸運轉盤"
              subtitle="30P / 次，獎品多元"
              badge="新"
              badgeVariant="new"
              ctaLabel="轉一次"
              accentColor="from-purple-500 to-violet-500"
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
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-left text-xs leading-6 text-amber-800 shadow-sm">
            <div className="font-bold mb-1">雲端同步暫時停用</div>
            <div>{supabaseEnvWarning}</div>
            <div>目前仍可正常體驗每日扭蛋與本地積分，待環境變數補齊後再恢復登入與雲端同步。</div>
          </div>
        )}
      </motion.div>

        {/* --- Info Card --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 mb-6 relative w-full"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500/0 via-amber-500/50 to-amber-500/0 opacity-50 rounded-t-2xl"></div>

          <div className="flex flex-col items-center w-full">
            {/* How it works */}
            <h3 className="text-sm font-bold text-stone-700 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              積分攻略
            </h3>

            <div className="w-full space-y-3 text-sm text-stone-600">
              <div className="flex items-start gap-3 bg-stone-50 rounded-lg p-3">
                <span className="text-lg">🎰</span>
                <div>
                  <p className="font-bold text-stone-700">每日轉蛋</p>
                  <p className="text-xs text-stone-500">每天一次免費轉蛋，積分直接入帳</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-stone-50 rounded-lg p-3">
                <span className="text-lg">📋</span>
                <div>
                  <p className="font-bold text-stone-700">護照簽到</p>
                  <p className="text-xs text-stone-500">連續簽到加成積分，7天/30天/100天里程碑</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-stone-50 rounded-lg p-3">
                <span className="text-lg">🛍️</span>
                <div>
                  <p className="font-bold text-stone-700">積分兌換</p>
                  <p className="text-xs text-stone-500">到護照商店用積分兌換甜點、咖啡及周邊</p>
                </div>
              </div>
            </div>

            {/* Kiwimu character */}
            <div className="mt-4 flex items-end justify-center gap-3">
              <div className="relative bg-white border border-stone-200 text-stone-600 text-[10px] px-3 py-2 rounded-2xl rounded-br-none shadow-sm max-w-[180px] text-right leading-relaxed">
                <p>
                  每天來轉轉好運，積分越多、離免費甜點越近喔 ✨
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
          className="bg-stone-100/80 rounded-2xl p-4 border border-stone-200 border-dashed mb-6 w-full flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-stone-200 flex items-center justify-center text-2xl shrink-0">
            🎨
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-black text-stone-600">我的 Kiwimu</h3>
              <span className="text-[10px] font-bold bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">即將推出</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">用積分解鎖背景、配件，收集 Bascat、Eggle 等夥伴角色</p>
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
          />
        )}
      </AnimatePresence>

      {/* --- Sticky Bottom Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 z-40 pb-8 sm:pb-4 safe-area-pb">
        {/* Step indicators */}
        <div className="max-w-md mx-auto w-full mb-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-stone-500 text-center">
          <span className="text-[11px] font-medium">① 遊戲賺積分</span>
          <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
          <span className="text-[11px] font-medium">② 轉盤花積分</span>
          <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
          <span className="text-[11px] font-medium text-amber-600">③ 護照商店換甜點</span>
        </div>
        <div className="max-w-md mx-auto w-full flex gap-3">
          {/* Points display */}
          <KiwimuButton
            variant="default"
            size="lg"
            className="flex-1 py-3.5 px-4 cursor-default hover:bg-white"
            disabled
          >
            <Coins className="w-4 h-4 text-amber-500" />
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
