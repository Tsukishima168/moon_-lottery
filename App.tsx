import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Coins, LogOut, MessageCircle, RefreshCw, Sparkles } from 'lucide-react';
import { getDeviceId, getPointsBalance, addPoints, buildPassportSyncUrl, consumePassportSyncAck, getPendingPassportSync, PointAction } from './pointsSystem';
import { hasSupabaseEnv, supabase } from './src/lib/supabase';
import LuckyWheel from './src/components/LuckyWheel';
import { GreenDialog } from './src/components/gacha/GreenDialog';
import { FORTUNES, JACKPOT_FORTUNE, findSavedFortune, type Fortune } from './src/data/fortunes';
import { sharePullToLine } from './src/lib/liffShare';
import { trackUserEvent } from './src/lib/eventTracker';
import { openPassportLogin, PASSPORT_AUTH_COMPLETE_EVENT } from './src/lib/authStorage';
import { trackUtmLanding, trackOutboundClick, buildFromUrl } from './src/lib/crossSiteTracking';
import { resolveEntryFrom, syncAttributionFromUrl } from './src/lib/attribution';
import { KiwimuToaster, kiwimuToast } from '@/components/kiwimu';

const trackGtagEvent = (eventName: string, params: Record<string, unknown> = {}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, { site_id: 'gacha', ...params });
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

const ASSETS = {
  passportUrl: 'https://passport.kiwimu.com',
  heroDesktop: '/assets/gacha-green/hero-desktop-9278df2b7c.webp',
  heroMobile: '/assets/gacha-green/hero-mobile-d7578411bf.webp',
  wheel: '/assets/gacha-green/wheel-ed6e052bf4.webp',
  blessing: '/assets/gacha-green/blessing-841d2d20d0.webp',
};
const MEMBER_JOURNEY_URL = buildFromUrl(ASSETS.passportUrl, 'gacha_member_return', {
  screen: 'passport', tab: 'journey', journey_mode: 'online',
});
const MEMBER_HOME_URL = buildFromUrl(ASSETS.passportUrl, 'gacha_header', { screen: 'passport', tab: 'hub' });

const POINT_PRIZES = [
  { id: 'bronze', label: '銅球', points: 5, weight: 45, color: 'bg-[#C9A46A]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'silver', label: '銀球', points: 10, weight: 30, color: 'bg-[#E5E5E5]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'gold', label: '金球', points: 25, weight: 15, color: 'bg-[#D4AF37]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'rainbow', label: '青球', points: 50, weight: 5, color: 'bg-[#2A9D8F]', border: 'border-[#111111]', glow: 'shadow-stone-300' },
  { id: 'lucky', label: '黑球', points: 100, weight: 3, color: 'bg-[#111111]', border: 'border-[#D4FF00]', glow: 'shadow-lime-200' },
  { id: 'jackpot', label: '月光球', points: 200, weight: 2, color: 'bg-[#D4FF00]', border: 'border-[#111111]', glow: 'shadow-lime-200' },
];


function EventModal({ prize, fortune, totalPoints, onClose, onGoToStore, onShareResult, returnFocusRef }: {
  prize: typeof POINT_PRIZES[0]; fortune: Fortune; totalPoints: number;
  onClose: () => void; onGoToStore: () => void; onShareResult: (message: string) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}) {
  useEffect(() => {
    trackGtagEvent('result_viewed', {
      prize_id: prize.id,
      prize_label: prize.label,
      prize_points: prize.points,
    });
  }, [prize.id, prize.label, prize.points]);
  const [sharing, setSharing] = useState(false);
  const share = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const result = await sharePullToLine(prize.label, prize.points);
      onShareResult(result.ok ? '已開啟 LINE 分享。' : 'message' in result ? result.message : '暫時無法分享，請稍後再試。');
    } catch { onShareResult('暫時無法分享，請稍後再試。'); }
    finally { setSharing(false); }
  };
  return (
    <GreenDialog open onClose={onClose} title="今天的好運" description="這份祝福，今天隨時都能回來看。" returnFocusRef={returnFocusRef}>
      <div className="gacha-fortune">
        <img src={ASSETS.blessing} alt="" width="84" height="100" className="gacha-fortune-mascot" />
        <span className="gacha-tag">{fortune.level} · {prize.label}</span>
        <h3>{fortune.text}</h3>
        <div className="gacha-small-story"><p className="gacha-eyebrow">像這樣的一天</p><p>{fortune.example}</p></div>
        <div className="gacha-small-action"><Sparkles size={18} aria-hidden="true" /><div><strong>今天，試著做一件小事</strong><p>{fortune.action}</p></div></div>
        <div className="gacha-reward-line"><span>今日收下 <strong>+{prize.points} P</strong></span><span>本機餘額 <strong>{totalPoints} P</strong></span></div>
        <p className="gacha-fine-print">祝福是生活小提醒；遊戲積分僅記錄於此裝置，與會員積分分開。</p>
        <div className="gacha-dialog-actions">
          <button type="button" className="gacha-button gacha-button-gold" onClick={onClose}>收下今天的祝福 <ArrowRight size={18} aria-hidden="true" /></button>
          <button type="button" className="gacha-button gacha-button-outline" onClick={share} disabled={sharing}><MessageCircle size={18} aria-hidden="true" />{sharing ? '準備分享中…' : '分享給 LINE 好友'}</button>
          <button type="button" className="gacha-text-button" onClick={onGoToStore}>查看護照紀錄 <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </GreenDialog>
  );
}

export default function App() {
  // Auth State
  const [authUser, setAuthUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setAuthUser(null);
      setAuthReady(true);
      return;
    }
    const sb = supabase;

    // 讀取 .kiwimu.com cookie session（跨網域共享）
    sb.auth.getSession().then(({ data: { session }, error }) => {
      if (error) throw error;
      setAuthUser(session?.user ?? null);
      setAuthReady(true);
      if (session?.user) {
        sb.rpc('update_last_seen', { p_site: 'gacha' }).then(() => {});
        trackUserEvent('site_visited', {
          site_id: 'gacha',
          source: 'initial_session',
          path: window.location.pathname,
        });
      }
    }).catch(() => { setAuthReady(true); showTransientToast('暫時無法確認會員狀態，請重新登入。'); });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      setAuthReady(true);
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
      void sb.auth.getSession().then(({ data: { session }, error }) => {
        if (error) throw error;
        setAuthUser(session?.user ?? null);
        if (session?.user) {
          sb.rpc('update_last_seen', { p_site: 'gacha' }).then(() => {});
          trackUserEvent('site_visited', {
            site_id: 'gacha',
            source: 'passport_popup',
            path: window.location.pathname,
          });
        }
      }).catch(() => showTransientToast('會員狀態尚未同步，請再試一次登入。'));
    };
    window.addEventListener(PASSPORT_AUTH_COMPLETE_EVENT, handlePassportAuthComplete);

    return () => {
      window.removeEventListener(PASSPORT_AUTH_COMPLETE_EVENT, handlePassportAuthComplete);
      subscription.unsubscribe();
    };
  }, []);

  const handlePassportLogin = () => {
    if (!authReady || authBusy) return;
    setAuthBusy(true);
    trackOutboundClick('https://passport.kiwimu.com', 'passport_login', {
      entrySurface: 'gacha_header',
      destinationType: 'internal',
    });
    openPassportLogin({
      intent: 'gacha_login',
      onComplete: () => setAuthBusy(false),
      onError: (detail) => { setAuthBusy(false); showTransientToast(detail.message || '登入失敗，請再試一次。'); },
    });
  };
  const handleSignOut = async () => {
    if (authBusy) return;
    if (!supabase) {
      setAuthUser(null);
      return;
    }

    setAuthBusy(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthUser(null);
      showTransientToast('已登出。');
    } catch (error) {
      console.error('Sign out failed', error);
      showTransientToast('登出尚未完成，請確認網路後再試一次。');
    } finally {
      setAuthBusy(false);
    }
  };

  const [showRules, setShowRules] = useState(false);
  const dailyButtonRef = useRef<HTMLButtonElement>(null);
  const wheelButtonRef = useRef<HTMLButtonElement>(null);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

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
    // entry_from：這次著陸的站內入口（原始 query 的 from，或 30 分鐘內的 kw_attr.from）；沒有就不帶。
    // 同樣要讀 __GACHA_INITIAL_SEARCH__，window.location.search 的 from 此時已被拔掉。
    const entryFrom = resolveEntryFrom(window.__GACHA_INITIAL_SEARCH__ ?? window.location.search);
    trackGtagEvent('page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
      ...(entryFrom ? { entry_from: entryFrom } : {}),
    });
    trackUtmLanding();
    // R4: 同步 kw_attr 第一接觸歸因 cookie（from／utm_source），供其他站建單時讀取。
    // 修 BLOCKER：index.html 的 inline script 在 React 掛載前就已經把 from/utm_* 從
    // window.location.search 清掉了，這裡必須讀 __GACHA_INITIAL_SEARCH__（inline script
    // 清除前存下的原始 query string），否則 cookie 永遠寫不進去。
    syncAttributionFromUrl(window.__GACHA_INITIAL_SEARCH__ ?? window.location.search);

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
            const prize = POINT_PRIZES.find(p => p.id === parsed.prizeId);
            const fortune = findSavedFortune(parsed.fortuneId, parsed.prizeId);
            if (prize && fortune) {
              setResultPrize(prize);
              setResultFortune(fortune);
            } else {
              setTodayResultUnavailable(true);
            }
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
        showTransientToast('Passport 已接收遊戲紀錄；可用積分以護照顯示為準。');
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
      randomFortune = JACKPOT_FORTUNE;
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

      // LIFF-4：廣播積分事件給 Passport（跨站同步）
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
    const syncUrl = pendingSync
      ? buildPassportSyncUrl(ASSETS.passportUrl, pendingSync.amount, 'gacha', pendingSync.latestTimestamp)
      : ASSETS.passportUrl;
    // R3: 站內跨站連結不用 utm_*，改用單一參數 from=<來源站>_<位置>。
    const url = buildFromUrl(syncUrl, 'gacha_store');

    trackOutboundClick(url, `passport_store:${label}`, {
      entrySurface: 'gacha_store',
      destinationType: 'internal',
    });

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
    <div className="gacha-page">
      <a className="gacha-skip" href="#gacha-main">跳到遊戲內容</a>
      <header className="gacha-local-header gacha-shell">
        <a href="/" className="gacha-wordmark" aria-label="月島遊戲中心首頁">月島<span>・</span>遊戲中心</a>
        <nav aria-label="遊戲中心導覽" className="gacha-local-nav">
          <button type="button" ref={rulesButtonRef} onClick={() => setShowRules(true)}>遊戲說明</button>
          <a href={MEMBER_HOME_URL} onClick={() => trackOutboundClick(MEMBER_HOME_URL, 'member_center', { entrySurface: 'gacha_header', destinationType: 'internal' })}>會員中心</a>
        </nav>
        <div className="gacha-account-tools">
          <div className="gacha-balance" aria-label={`本機遊戲積分 ${totalPoints}`}><Coins size={17} aria-hidden="true" /><span>本機遊戲積分</span><strong>{totalPoints.toLocaleString()}</strong></div>
          {authUser ? <button type="button" className="gacha-auth-button" disabled={authBusy} onClick={handleSignOut} aria-label={authBusy ? '登出中' : '登出'}><LogOut size={16} aria-hidden="true" /><span>{authBusy ? '登出中…' : '登出'}</span></button> : hasSupabaseEnv ? <button type="button" className="gacha-auth-button" disabled={!authReady || authBusy} onClick={handlePassportLogin}>{!authReady ? '確認中…' : authBusy ? '登入中…' : '登入'}</button> : null}
        </div>
      </header>

      <main id="gacha-main" className="gacha-shell" tabIndex={-1}>
        <section className="gacha-hero" aria-labelledby="gacha-title" aria-busy={isSpinning}>
          <motion.picture className="gacha-hero-art" animate={isSpinning && !reduceMotion ? { scale: [1, 1.012, 1], rotate: [0, 0.3, -0.3, 0] } : { scale: 1, rotate: 0 }} transition={{ duration: 1.2, repeat: isSpinning && !reduceMotion ? Infinity : 0 }}>
            <source media="(max-width: 900px)" srcSet={ASSETS.heroMobile} />
            <img src={ASSETS.heroDesktop} width="1942" height="809" fetchPriority="high" alt="深綠搖珠機與 Kiwimu，坐在柔和窗光裡。" />
          </motion.picture>
          <div className="gacha-hero-copy">
            <p className="gacha-eyebrow">04 / PLAY & FORTUNE</p>
            <h1 id="gacha-title">轉出今天的好運。</h1>
            <p className="gacha-hero-description">每天一次免費搖珠，<br className="gacha-mobile-break" />收下一份祝福與生活小提醒。</p>
            <button type="button" ref={dailyButtonRef} className="gacha-button gacha-button-gold gacha-daily-button" disabled={isSpinning} onClick={handleGachaClick}>
              {isSpinning ? <><RefreshCw size={20} aria-hidden="true" className="gacha-spinner" />好運正在路上…</> : <>{isPlayedToday ? todayResultUnavailable ? '查看今日紀錄' : '看看今天的祝福' : '免費轉一次'}<ArrowRight size={22} aria-hidden="true" /></>}
            </button>
            <p className="gacha-hero-note" role="status">{isSpinning ? '請稍候，搖珠完成後會顯示結果。' : isPlayedToday ? todayResultUnavailable ? '今天已搖過，紀錄暫時無法讀取。' : '今天已收下祝福，明天再來轉一次。' : '每日一次・遊戲積分僅記錄於此裝置'}</p>
            {todayResultUnavailable && <button type="button" className="gacha-hero-retry" onClick={() => window.location.reload()}>重新整理紀錄</button>}
          </div>
        </section>

        <section className="gacha-discover" aria-label="再逛一下遊戲中心">
          <div className="gacha-wheel-teaser">
            <img src={ASSETS.wheel} alt="" width="160" height="160" loading="lazy" />
            <div><h2><span className="gacha-game-number">02</span>幸運轉盤</h2><p className="gacha-teaser-note">30P／次・獎品預覽</p><button type="button" ref={wheelButtonRef} className="gacha-button gacha-button-outline" onClick={() => setShowWheelModal(true)}>查看轉盤 <ArrowRight size={18} aria-hidden="true" /></button></div>
          </div>
          <div className="gacha-little-note"><div><h2>一份祝福，一件小事</h2><p>把今天的小提醒，放進生活裡。</p></div><img src={ASSETS.blessing} alt="" width="90" height="110" loading="lazy" /></div>
        </section>
      </main>

      <footer className="gacha-footer gacha-shell">
        <p>本機遊戲積分與會員積分分開，實體兌換尚未開放。</p>
        <a className="gacha-member-return" href={MEMBER_JOURNEY_URL} onClick={() => trackOutboundClick(MEMBER_JOURNEY_URL, 'member_journey', { entrySurface: 'gacha_member_return', destinationType: 'member_journey' })}>回會員中心，看看下一步 <ArrowRight size={16} aria-hidden="true" /></a>
        <span className="gacha-footer-brand">MOON ISLAND · KIWIMU</span>
      </footer>

      <GreenDialog open={showRules} onClose={() => setShowRules(false)} title="遊戲說明" description="先收一份祝福，再決定要不要多玩一回。" returnFocusRef={rulesButtonRef}>
        <div className="gacha-rules">
          <section><span className="gacha-tag">01 · 每日免費</span><h3>搖珠機，每天一份好運</h3><p>不必登入，每天可免費搖一次。收下 5–200 本機遊戲積分與一份祝福；當天再次點擊會打開原本的結果。</p><p>每日次數與積分以此瀏覽器的紀錄為準，清除紀錄或換裝置不會帶走這份紀錄。</p></section>
          <section><span className="gacha-tag">02 · 每次 30P</span><h3>幸運轉盤，想玩再玩</h3><p>使用本機遊戲積分抽取。積分不足時，可以先玩每日免費搖珠；抽到免費機會，下一次便不扣積分。</p><p>券與印章目前為預覽，尚不能折抵、兌換或完成會員集章。抽取前可在轉盤查看完整機率。</p></section>
          <section><h3>每日搖珠的機率</h3><div className="gacha-prize-list">{POINT_PRIZES.map((prize) => <div key={prize.id}><span>{prize.label}<small>+{prize.points} P</small></span><strong>{prize.weight}%</strong></div>)}</div></section>
          <aside className="gacha-small-action"><Coins size={18} aria-hidden="true" /><div><strong>兩種積分，分開查看</strong><p>這裡顯示本機遊戲積分。護照的可用積分以會員中心顯示為準，不能將本機餘額當成到店兌換憑證。</p></div></aside>
          <button type="button" className="gacha-button gacha-button-outline" onClick={handleGoToStoreFromBar}>查看護照紀錄 <ArrowRight size={18} aria-hidden="true" /></button>
          <button type="button" className="gacha-button gacha-button-gold" onClick={() => setShowRules(false)}>我知道了，回到遊戲</button>
        </div>
      </GreenDialog>
      {showEventModal && resultPrize && resultFortune && <EventModal prize={resultPrize} fortune={resultFortune} totalPoints={totalPoints} onClose={() => setShowEventModal(false)} onGoToStore={handleGoToStore} onShareResult={showTransientToast} returnFocusRef={dailyButtonRef} />}
      {showWheelModal && <LuckyWheel onClose={() => setShowWheelModal(false)} onPointsChange={setTotalPoints} onToast={showTransientToast} returnFocusRef={wheelButtonRef} dailyButtonRef={dailyButtonRef} onGoToDaily={() => { setShowWheelModal(false); dailyButtonRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }} />}
      <KiwimuToaster />
    </div>
  );
}
