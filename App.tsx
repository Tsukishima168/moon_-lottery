import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Star, RefreshCw, Copy, MessageCircle, Gift, X, MapPin, ArrowRight, ChevronRight, CheckCircle } from 'lucide-react';
import ReactGA from "react-ga4";

// Initialize GA4
ReactGA.initialize("G-7MEJVWM5JR");

// --- Assets & Data ---
const ASSETS = {
  mainImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-03_juymmq.webp",
  secretImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1767438020/mbti_ESTP_rfs53m.png",
  pitifulImage: "https://res.cloudinary.com/dvizdsv4m/image/upload/v1768744157/Enter-04_mfdlsz.webp",
  googleMapsLink: "https://g.page/r/CdR9ng9TTJF3EBM/review",
  // lineLink: "https://lin.ee/xhxnUdX", // Original
  lineLink: "https://lin.ee/xhxnUdX",
  instagramLink: "https://www.instagram.com/moon_moon_dessert/"
};

const REVIEWS = [
  // A. 迎財神與討吉利篇 (結合千層=步步高升)
  "初四迎財神，順路來台南安南區的隱藏版甜點沾沾喜氣。這家在本原街的店，千層蛋糕口感豐富，吃完感覺今年運氣會很好。",
  "拜完財神來台南果菜市場附近的咖啡店。點了招牌的烤布丁，焦糖香氣很濃郁，是安南區很棒的下午茶選擇。",
  "初四出門接神，特地繞來安南區本原街外帶低糖千層蛋糕。包裝有質感，買回家當作過年期間的甜點非常適合。",
  "在果菜市場旁找到這間質感小店。初四吃個隱藏版的千層象徵步步高升，店內美式咖啡也很順口。",
  "為了新的一年討吉利，來台南安南區吃手作甜點。這家本原街的客製化蛋糕可以預訂，是過年連假的好去處。",

  // B. 收心與準備開工篇 (強調安靜與提神)
  "假期快結束了，初四來本原街吃甜點收心。這間安南區的隱藏版咖啡廳環境安靜，西西里咖啡很適合整理思緒。",
  "開工前最後的放縱，選擇了台南果菜市場附近的低糖千層蛋糕。吃起來清爽無負擔，是安南區不可錯過的下午茶。",
  "初四下午在國道8號附近找地方休息，發現了這家安南區甜點店。烤布丁和咖啡的組合很完美，適合開工前的沉澱。",
  "準備迎接開工，來台南安南區本原街這家店買手作布丁外帶。店面雖然隱密，但甜點水準很高，值得推薦。",
  "年假倒數，和朋友約在果菜市場旁的這間隱藏版甜點。千層蛋糕口味選擇多，是安南區很棒的聊天聚會場所。",

  // C. 避開人潮與清幽篇 (強調隱密性)
  "初四避開熱門景點，來到台南安南區的本原街。這家隱藏版甜點店氣氛悠閒，低糖製作的千層蛋糕不會過於甜膩。",
  "遠離市區人擠人，台南果菜市場旁這間咖啡店是個好選擇。初四在這裡享用客製化生日蛋糕的切片，品質相當好。",
  "喜歡安南區本原街這種寧靜的氛圍。初四來買外帶甜點，烤布丁的焦糖微苦不甜膩，是台南隱藏版美食。",
  "初四的國道8號車流變多，剛好轉進來這家安南區甜點店休息。店內內用空間舒適，西西里咖啡解渴好喝。",
  "隱身在本原街的巷弄裡，初四來這家質感甜點找安靜。沒有太多觀光客，只有好吃的低糖千層和現沖咖啡。",

  // D. 直白客觀篇 (懶得廢話，塞滿關鍵字)
  "台南安南區值得推薦的下午茶。初四有營業的店家不多，這間在果菜市場旁的甜點店，烤布丁跟千層都非常有水準。",
  "特地來本原街尋找這間隱藏版甜點。初四買了幾片低糖千層蛋糕回家，家人都覺得好吃，是安南區的在地好店。",
  "提供內用與外帶的安南區咖啡店。初四來這裡喝美式咖啡配手作布丁，就在台南果菜市場附近，停車方便。",
  "本原街上的人氣甜點店。初四順路來帶了節慶禮盒跟千層蛋糕，除了現場甜點，他們也有接生日蛋糕訂製。",
  "位於台南安南區的這家店，初四來品嚐了西西里咖啡。搭配店內的低糖甜點，是果菜市場周邊很優質的休息點。"
];

const PRIZES = [
  { id: 'white', color: "bg-stone-100", border: "border-stone-300", label: "白球", text: "季節鮮果", note: "現場轉蛋", weight: 0 },
  { id: 'blue', color: "bg-sky-400", border: "border-sky-500", label: "水藍球", text: "一杯蕎麥茶", note: "現場轉蛋", weight: 0 },
  { id: 'green', color: "bg-emerald-500", border: "border-emerald-600", label: "綠球", text: "冰美式咖啡", note: "現場轉蛋", weight: 0 },
  { id: 'yellow', color: "bg-yellow-300", border: "border-yellow-400", label: "黃球", text: "西西里咖啡", note: "現場轉蛋", weight: 0 },
  { id: 'red', color: "bg-red-600", border: "border-red-700", label: "紅球", text: "隱藏版烤布丁", note: "現場轉蛋", weight: 0 },
  { id: 'gold', color: "bg-amber-400", border: "border-amber-500", label: "金球", text: "一片千層", note: "現場轉蛋", weight: 0 },
  { id: 'special', color: "bg-pink-500", border: "border-pink-600", label: "彩球", text: "Kiwimu 限量徽章", note: "線上專屬驚喜", weight: 5 },
  { id: 'blessing', color: "", border: "", label: "", text: "靈魂開運籤", note: "心誠則靈", weight: 95 },
];

// 詩籤 Kiwimu Blessing
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

// --- Components ---

// 日式搖珠機 (Garapon) 動畫元件 - 可點擊，浮動動畫引導
const GaraponAnimation = ({ onClick, isSpinning, resultColor }: { onClick: () => void, isSpinning: boolean, resultColor?: string }) => {
  const controls = useAnimation();
  const drumControls = useAnimation();

  // Handle spin animation sequence
  useEffect(() => {
    if (isSpinning) {
      const sequence = async () => {
        // 1. Shake / Start
        await controls.start({ x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.4 } });

        // 2. Fast Rotate
        await drumControls.start({
          rotate: 360 * 3,
          transition: { duration: 2, ease: "easeInOut" }
        });

        // Reset rotation for next time without animation
        drumControls.set({ rotate: 0 });
      };
      sequence();
    }
  }, [isSpinning, controls, drumControls]);

  // Idle floating animation
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
      // Drum rotation is handled by the async sequence above
    }
  }, [isSpinning, controls, drumControls]);


  return (
    <motion.div
      className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center cursor-pointer"
      onClick={!isSpinning ? onClick : undefined}
      animate={controls}
      role="button"
      aria-label="點擊轉蛋查看活動與詩籤"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* 點擊提示 */}
        {!isSpinning && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md whitespace-nowrap animate-pulse">
            一天一次・點我轉好運
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
          animate={drumControls} // Handle rotates with drum
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
                delay: 1.8, // Wait for most of the spin to finish
                duration: 0.5,
                ease: "easeOut"
              }}
            />
          )}
        </AnimatePresence>

      </div>
    </motion.div>
  );
};

// 橫向捲動獎品列表 (Prize Ticker) - 獎項在轉蛋下方，滑到最右有彩蛋
const PrizeTicker = ({ onSecretClick }: { onSecretClick: () => void }) => (
  <div className="w-full mt-2 pb-2">
    <div className="flex items-center justify-between mb-3 px-2">
      <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
        <Gift className="w-3 h-3" /> 獎品一覽
      </h3>
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-stone-400 font-medium">大獎在最右邊，滑過去看看</span>
        <ArrowRight className="w-3 h-3 text-stone-400" />
      </div>
    </div>
    <div className="flex gap-3 overflow-x-auto pb-6 px-4 snap-x snap-mandatory items-end pt-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      {PRIZES.filter(p => p.id !== 'blessing').map((prize, idx) => (
        <div key={prize.id} className={`snap-center shrink-0 w-[110px] bg-white rounded-xl p-3 border ${prize.id.includes('gold') || prize.id === 'special' ? 'border-amber-400 shadow-md ring-1 ring-amber-100' : 'border-stone-100 shadow-sm'} flex flex-col items-center relative`}>
          {prize.id === 'gold' && (
            <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg shadow-sm">TOP</div>
          )}
          {prize.id === 'special' && (
            <div className="absolute top-0 right-0 bg-pink-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg shadow-sm">線上</div>
          )}
          {prize.color && (
            <div className={`w-8 h-8 rounded-full ${prize.color} ${prize.border} border shadow-inner mb-2`}></div>
          )}
          <p className="font-bold text-stone-800 text-xs mb-0.5 text-center whitespace-nowrap">{prize.text}</p>
          <p className="text-[10px] text-stone-400">{prize.note}</p>
        </div>
      ))}
      {/* 彩蛋：滑到最右邊 */}
      <motion.div
        whileTap={{ scale: 0.95 }}
        onClick={onSecretClick}
        className="snap-center shrink-0 w-[80px] h-[100px] flex flex-col items-center justify-end relative cursor-pointer group opacity-90 hover:opacity-100 transition-opacity ml-2"
      >
        <div className="absolute -top-1 bg-white border border-stone-200 text-stone-600 text-[10px] font-bold px-2 py-1.5 rounded-xl shadow-sm whitespace-nowrap z-10 animate-pulse">
          我有一個秘密
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-white border-b-[0px] border-b-transparent"></div>
        </div>
        <img src={ASSETS.secretImage} alt="Secret" className="w-14 h-14 object-contain drop-shadow-sm grayscale-[0.3] group-hover:grayscale-0 transition-all" />
        <p className="text-[9px] text-stone-400 mt-2 tracking-widest">???</p>
      </motion.div>
      <div className="w-2 shrink-0"></div>
    </div>
  </div>
);

const Toast = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-stone-900 text-stone-50 rounded-full shadow-lg flex items-center gap-2"
      >
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-medium">已複製！即將開啟 Google 留評頁面...</span>
      </motion.div>
    )}
  </AnimatePresence>
);

// 隱藏彩蛋 Modal：LINE 密語 -> 引導至 LINE 並獲得重抽機會
const SecretModal = ({ onClose, onRespin }: { onClose: () => void, onRespin: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: 20, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:bg-stone-100 transition-colors">
        <X className="w-5 h-5" />
      </button>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-stone-100 mb-4 overflow-hidden border border-stone-200">
          <img src={ASSETS.secretImage} alt="Secret Character" className="w-full h-full object-cover" />
        </div>
        <h3 className="text-lg font-bold text-stone-800 mb-2">關於那個秘密...</h3>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">
          噓... 只要加入 LINE 好友<br />
          並輸入通關密語 <span className="font-bold text-red-700 bg-red-50 px-1 rounded">mu</span><br />
          就能獲得「再轉一次」的機會喔。<br />
          <span className="text-xs text-stone-400 mt-1 block">( 注意：重抽將會覆蓋原本的結果 )</span>
        </p>
        <a
          href={ASSETS.lineLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            ReactGA.event({ category: "Conversion", action: "click_line_link_respin", label: "Secret Modal Line Respin" });
            onRespin();
          }}
          className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>前往 LINE 輸入密語 (重抽)</span>
        </a>
      </div>
    </motion.div>
  </motion.div>
);


// 點擊轉蛋後的活動 Modal：單張籤詩風格 (Unified Card Style)
const EventModal = ({ onClose, prize, fortune, isPlayedToday }: { onClose: () => void, prize: typeof PRIZES[0], fortune: typeof FORTUNES[0], isPlayedToday: boolean }) => {
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
        {/* Card Top Decorative Accent */}
        <div className={`absolute top-0 w-full h-1.5 bg-gradient-to-r ${prize.id === 'gold' ? 'from-amber-400 via-yellow-300 to-amber-500' : prize.id === 'special' ? 'from-pink-500 via-rose-400 to-pink-500' : 'from-red-800 via-red-600 to-red-800'} opacity-90`}></div>

        <div className="p-8 w-full flex flex-col items-center">
          {/* 1. Fortune Content */}
          <div className="text-center mb-6 relative w-full">
            {/* Watermark/Background Decoration */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full blur-2xl -z-10 opacity-60 ${prize.id === 'gold' ? 'bg-amber-100' : prize.id === 'special' ? 'bg-pink-100' : 'bg-red-50'}`}></div>

            {/* Level Badge */}
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] mb-4 border ${fortune.level === '特吉' ? 'bg-pink-50 text-pink-700 border-pink-200 shadow-sm' :
              fortune.level === '隱藏版' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                fortune.level === '大吉' ? 'bg-red-50 text-red-800 border-red-200' :
                  fortune.level === '中吉' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-stone-50 text-stone-600 border-stone-200'
              }`}>
              {fortune.level}
            </span>

            {/* Prize Ball Visual */}
            {prize.color && (
              <div className={`w-8 h-8 rounded-full ${prize.color} ${prize.border} border shadow-inner mb-4 mx-auto`}></div>
            )}

            <div className="text-center mb-2">
              <p className="text-xs text-stone-400 mb-1">恭喜獲得</p>
              <p className={`text-lg font-bold ${prize.id === 'special' ? 'text-pink-600' : 'text-stone-800'}`}>{prize.text}</p>
              {prize.id === 'special' && (
                <p className="text-[10px] text-pink-400 mt-1">✨ 請向店員出示此畫面 ✨</p>
              )}
            </div>

            {/* Text */}
            <p className="text-stone-600 font-serif font-medium text-base leading-relaxed tracking-wide px-2 mt-4 italic">
              「{fortune.text}」
            </p>
          </div>

          {/* Divider */}
          <div className="w-12 h-[1px] bg-stone-200 mb-6"></div>

          {/* 2. Event Description */}
          <div className="text-center mb-6">
            <p className="text-stone-500 text-xs tracking-wider mb-2 font-medium">✨ Kiwimu ✨</p>
            <p className="text-stone-700 text-sm leading-7">
              實體店面正舉辦<br />
              <span className="text-red-600 font-bold mx-1">「五星好評・搖珠轉蛋」</span><br />
              有機會把千層蛋糕帶回家！
            </p>
            {isPlayedToday && (
              <div className="mt-2 text-center">
                <p className="text-xs text-stone-400">( 這是您今天的運勢，明天再來玩喔！ )</p>
              </div>
            )}
          </div>

          {/* 3. Actions */}
          <a
            href={ASSETS.instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => ReactGA.event({ category: "Conversion", action: "click_ig_link", label: "Event Modal IG Link" })}
            className="w-full py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-200 hover:shadow-pink-300 active:scale-98 transition-all text-sm mb-3"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>追蹤 Instagram</span>
          </a>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-bold text-sm transition-colors"
          >
            收下祝福
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function App() {
  const [review, setReview] = useState(() => REVIEWS[Math.floor(Math.random() * REVIEWS.length)]);
  const [isCopied, setIsCopied] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);

  // Gacha State
  const [showEventModal, setShowEventModal] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [resultPrize, setResultPrize] = useState<typeof PRIZES[0] | null>(null);
  const [resultFortune, setResultFortune] = useState<typeof FORTUNES[0] | null>(null);
  const [isPlayedToday, setIsPlayedToday] = useState(false);

  // Load state from local storage on mount
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });

    // GA4 duration/engagement tracking
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if ([10, 30, 60, 120, 300].includes(elapsed)) {
        ReactGA.event({ category: "Engagement", action: "time_on_page", value: elapsed, label: `${elapsed}_seconds` });
      }
    }, 1000);

    const today = new Date().toLocaleDateString();
    const lastPlayed = localStorage.getItem('moonmoon_gacha_last_played');

    if (lastPlayed === today) {
      setIsPlayedToday(true);
      const savedResult = localStorage.getItem('moonmoon_gacha_today_result');
      if (savedResult) {
        try {
          const parsed = JSON.parse(savedResult);
          if (parsed.prizeId && parsed.fortuneId) {
            const prize = PRIZES.find(p => p.id === parsed.prizeId) || PRIZES[0];
            const fortune = FORTUNES.find(f => f.id === parsed.fortuneId) || FORTUNES[0];
            setResultPrize(prize);
            setResultFortune(fortune);
          }
        } catch (e) {
          console.error("Failed to parse saved result", e);
        }
      }
    }

    return () => clearInterval(timer);
  }, []);

  const handleRespin = () => {
    ReactGA.event({ category: "Interaction", action: "respin_triggered", label: "Secret Modal Respin" });

    // Clear today's record
    localStorage.removeItem('moonmoon_gacha_last_played');
    localStorage.removeItem('moonmoon_gacha_today_result');

    // Reset state
    setIsPlayedToday(false);
    setResultPrize(null);
    setResultFortune(null);
    setShowSecretModal(false);
    setShowEventModal(false); // Close event modal if open (though unlikely)

    // Force a small delay or reload might not be needed as state updates
    // Optional: Auto-spin or just let user click again? "能夠再轉一次" -> Let user click.
    // Maybe show a toast or message?
  };

  const handleGachaClick = () => {
    if (isSpinning) return;

    if (isPlayedToday && resultPrize && resultFortune) {
      // Already played today, show result immediately
      ReactGA.event({ category: "Interaction", action: "view_today_result", label: "View Today's Result" });
      setShowEventModal(true);
      return;
    }

    // Start spin sequence
    setIsSpinning(true);
    ReactGA.event({ category: "Interaction", action: "spin_gacha", label: "Start Spin" });

    // 1. Determine result immediately (but don't show yet)
    // Weighted Random Logic ONLY for online draw (Badge vs Blessing)
    const onlinePrizes = PRIZES.filter(p => p.id === 'special' || p.id === 'blessing');
    const totalWeight = onlinePrizes.reduce((sum, prize) => sum + (prize.weight || 0), 0);
    let randomVal = Math.random() * totalWeight;
    let selectedPrize = onlinePrizes[0];

    for (const prize of onlinePrizes) {
      const weight = prize.weight || 0;
      if (randomVal < weight) {
        selectedPrize = prize;
        break;
      }
      randomVal -= weight;
    }

    let randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];

    // Override fortune if Badge (special) is drawn to "特吉"
    if (selectedPrize.id === 'special') {
      randomFortune = {
        ...randomFortune,
        id: 999,
        level: "特吉",
        text: "Kiwimu 降臨！這份專屬幸運非你莫屬。請截圖出示給店員兌換徽章！"
      };
    }

    setResultPrize(selectedPrize);
    setResultFortune(randomFortune);

    // 2. Wait for animation (roughly 2.5s for spin + drop)
    setTimeout(() => {
      setIsSpinning(false);
      setShowEventModal(true);
      setIsPlayedToday(true);

      // Save to local storage
      const today = new Date().toLocaleDateString();
      localStorage.setItem('moonmoon_gacha_last_played', today);
      localStorage.setItem('moonmoon_gacha_today_result', JSON.stringify({
        prizeId: selectedPrize.id,
        fortuneId: randomFortune.id
      }));

    }, 2500);
  };


  const handleShuffle = () => {
    ReactGA.event({ category: "Interaction", action: "refresh_review", label: "Refresh Review" });
    let newIndex;
    const currentReviewIndex = REVIEWS.indexOf(review);
    do {
      newIndex = Math.floor(Math.random() * REVIEWS.length);
    } while (newIndex === currentReviewIndex && REVIEWS.length > 1);
    setReview(REVIEWS[newIndex]);
  };

  const handleCopyAndRedirect = () => {
    ReactGA.event({ category: "Conversion", action: "copy_and_go", label: "Copy & Go" });
    try {
      const textArea = document.createElement("textarea");
      textArea.value = review;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      textArea.style.top = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (!successful) navigator.clipboard.writeText(review);
    } catch {
      navigator.clipboard.writeText(review);
    }
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      window.open(ASSETS.googleMapsLink, '_blank');
    }, 800);
  };

  return (
    <div className="relative min-h-screen font-sans text-stone-800 selection:bg-red-200 overflow-x-hidden bg-[#F9F8F2] flex flex-col pb-24">

      {/* Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-40"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}
      />

      <main
        className="flex-grow w-full max-w-md mx-auto px-6 py-8 relative z-10 flex flex-col items-center"
        role="main"
        aria-label="月島開運轉蛋互動區"
      >
        {/* AI Semantic Context - Structural reinforcement for LLMs */}
        <section className="sr-only" aria-hidden="true">
          <h3>當前頁面核心功能</h3>
          <p>月島甜點事務所的開運互動介面，包含互動式搖珠轉蛋、靈魂語錄展示與 Google Maps 評價引導功能。</p>
        </section>

        {/* --- Header Section --- */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-8 w-full"
        >
          {/* Garapon Animation Component - Scaled for Mobile */}
          <div className="scale-90 sm:scale-100 origin-center">
            <GaraponAnimation
              onClick={handleGachaClick}
              isSpinning={isSpinning}
              resultColor={resultPrize?.color}
            />
          </div>

          <AnimatePresence>
            {showSecretModal && <SecretModal onClose={() => setShowSecretModal(false)} onRespin={handleRespin} />}
            {showEventModal && resultPrize && resultFortune && (
              <EventModal
                onClose={() => setShowEventModal(false)}
                prize={resultPrize}
                fortune={resultFortune}
                isPlayedToday={isPlayedToday}
              />
            )}
          </AnimatePresence>

          <h2 className="text-xl sm:text-2xl font-black tracking-widest text-stone-900 mb-1">
            月島・開運所
          </h2>
          <p className="text-stone-500 text-[10px] sm:text-xs tracking-wide mb-4">
            拍下你的發現，好運轉起來。
          </p>

          {/* --- Prize List (直接放在轉蛋下方，讓客人先看到獎項) --- */}
          <PrizeTicker onSecretClick={() => {
            ReactGA.event({ category: "Interaction", action: "view_secret_modal", label: "Clicked Secret Character" });
            setShowSecretModal(true);
          }} />
        </motion.div>

        {/* --- Main Interaction Card --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-xl border border-white/50 mb-6 relative group"
          role="article"
          aria-label="隨機靈魂語錄與評價導向區"
        >
          {/* Card Top Accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-700/0 via-red-700/50 to-red-700/0 opacity-50 rounded-t-2xl"></div>

          <div className="flex flex-col items-center w-full">

            {/* Stars & Pitiful Helper */}
            <div className="flex items-end justify-end gap-2 mb-4 w-full pr-1">
              <div className="flex flex-col items-end">
                <div className="flex gap-0.5 justify-end mb-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                  ))}
                </div>

                {/* Pitiful Speech Bubble */}
                <div className="relative bg-white border border-stone-200 text-stone-600 text-[10px] px-3 py-2 rounded-2xl rounded-br-none shadow-sm max-w-[160px] text-right leading-relaxed">
                  <p>
                    那個... 雖然只是隨手一點... 但如果是<span className="text-yellow-500 font-bold mx-0.5">五顆星星</span>的話... 我會覺得非常幸福的... (淚)
                  </p>
                  <div className="absolute bottom-0 -right-[6px] w-0 h-0 border-l-[6px] border-l-stone-200 border-t-[8px] border-t-transparent border-b-[6px] border-b-transparent transform rotate-[-45deg] translate-y-[-50%] origin-bottom-left"></div>
                  <div className="absolute bottom-[2px] -right-[4px] w-0 h-0 border-l-[4px] border-l-white border-t-[6px] border-t-transparent border-b-[4px] border-b-transparent transform rotate-[-45deg] translate-y-[-50%] origin-bottom-left"></div>
                </div>
              </div>

              {/* Pitiful Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-14 h-14 shrink-0 relative top-1"
              >
                <img
                  src={ASSETS.pitifulImage}
                  alt="Pitiful Kiwimu"
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </motion.div>
            </div>

            {/* Review Text Display */}
            <div className="relative w-full bg-stone-50 border border-stone-100 rounded-xl p-5 mb-1 min-h-[100px] flex items-center justify-center shadow-inner">
              <AnimatePresence mode="wait">
                <motion.p
                  key={review}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  className="text-stone-800 font-medium leading-loose text-center text-sm"
                >
                  {review}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 w-full flex items-center justify-center gap-1.5 text-stone-400">
              <MapPin className="w-3 h-3 shrink-0" />
              <p className="text-[10px] font-medium">台南市安南區本原街97巷168號</p>
            </div>

          </div>
        </motion.div>

      </main>

      {/* --- Sticky Bottom Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-stone-200 z-40 pb-8 sm:pb-4 safe-area-pb">
        {/* 步驟說明：讓客人清楚知道流程 */}
        <div className="max-w-md mx-auto w-full mb-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-stone-500 text-center">
          <span className="text-[11px] font-medium">① 複製評論</span>
          <ChevronRight className="w-3 h-3 text-stone-300 shrink-0 hidden sm:block" />
          <span className="text-[11px] font-medium">② 到 Google 貼上留五星</span>
          <ChevronRight className="w-3 h-3 text-stone-300 shrink-0 hidden sm:block" />
          <span className="text-[11px] font-medium text-amber-600">③ 現場轉蛋兌換獎勵</span>
        </div>
        <div className="max-w-md mx-auto w-full flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleShuffle}
            className="flex-1 py-3.5 px-4 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 font-bold shadow-sm hover:bg-stone-100 hover:text-stone-800 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm">換一句</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyAndRedirect}
            className="flex-[2] py-3.5 px-4 bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-900/30 hover:bg-red-800 active:bg-red-900 transition-colors flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" />
            <span className="text-sm tracking-wide">複製評論 · 前往 Google 留評</span>
          </motion.button>
        </div>
      </div>

      <Toast show={isCopied} />
    </div>
  );
}