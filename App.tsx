import React, { useState, useEffect } from 'react';
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
  lineLink: "https://lin.ee/xhxnUdX",
  instagramLink: "https://www.instagram.com/moonmoon_dessert/"
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

// 原始 6 球獎項結構（白→金）
const PRIZES = [
  { id: 'white', color: "bg-stone-100", border: "border-stone-300", label: "白球", text: "季節鮮果", note: "維他命C" },
  { id: 'blue', color: "bg-sky-400", border: "border-sky-500", label: "水藍球", text: "一杯蕎麥茶", note: "無咖啡因" },
  { id: 'green', color: "bg-emerald-500", border: "border-emerald-600", label: "綠球", text: "冰美式咖啡", note: "中深焙" },
  { id: 'yellow', color: "bg-yellow-300", border: "border-yellow-400", label: "黃球", text: "西西里咖啡", note: "解膩首選" },
  { id: 'red', color: "bg-red-600", border: "border-red-700", label: "紅球", text: "隱藏版烤布丁", note: "招牌" },
  { id: 'gold', color: "bg-amber-400", border: "border-amber-500", label: "金球", text: "一片千層", note: "本日最大獎" },
];

// 詩籤 Kiwimu Blessing
const FORTUNES = [
  { level: "大吉", text: "新的一年，願你的煩惱像我的工作一樣少。" },
  { level: "中吉", text: "變胖沒關係，那是你對甜點尊重的重量。" },
  { level: "小吉", text: "把錢變成喜歡的形狀，例如千層蛋糕。" },
  { level: "吉", text: "今天的運氣，適合再來一顆布丁。" },
  { level: "大吉", text: "願你的財運，像台南的糖度一樣高。" },
  { level: "中吉", text: "工作可以低糖，但生活要全糖。" },
  { level: "吉", text: "老闆說，轉到這張的人，今年會變漂亮。" },
  { level: "小吉", text: "休息是為了走更長的路，吃甜點是為了不想走路。" },
  { level: "大吉", text: "恭喜，你今年的桃花運會跟鮮奶油一樣順滑。" },
  { level: "隱藏版", text: "Kiwimu 覺得你今天長得很好看。" }
];

// --- Components ---

// 日式搖珠機 (Garapon) 動畫元件 - 可點擊，浮動動畫引導
const GaraponAnimation = ({ onClick }: { onClick: () => void }) => {
  const controls = useAnimation();
  const handleClick = async () => {
    await controls.start({ x: [0, -6, 6, -6, 6, 0], transition: { duration: 0.35 } });
    onClick();
  };
  return (
    <motion.div
      className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      animate={{ y: [0, -5, 0] }}
      transition={{ y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
      role="button"
      aria-label="點擊轉蛋查看活動與詩籤"
    >
      <motion.div className="relative w-full h-full flex items-center justify-center" animate={controls}>
        {/* 點擊提示 */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md whitespace-nowrap animate-pulse">
          點我轉好運
        </div>

        {/* Stand Base */}
        <div className="absolute bottom-0 w-32 h-4 bg-stone-800 rounded-lg z-10"></div>
        <div className="absolute bottom-2 left-10 w-4 h-24 bg-stone-800 -rotate-12 z-0"></div>
        <div className="absolute bottom-2 right-10 w-4 h-24 bg-stone-800 rotate-12 z-0"></div>

        {/* Rotating Hexagon Drum */}
        <motion.div
          className="relative w-32 h-32 z-10"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
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
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-1 h-12 bg-stone-400 origin-top translate-y-[-2px]"></div>
          <div className="w-3 h-3 bg-stone-900 rounded-full translate-x-[-4px] translate-y-10"></div>
        </motion.div>

        {/* Dropping Ball */}
        <motion.div
          className="absolute bottom-4 z-30 w-6 h-6 rounded-full bg-amber-400 border-2 border-amber-500 shadow-md"
          initial={{ y: -40, opacity: 0, scale: 0 }}
          animate={{
            y: [0, 20, 20],
            x: [0, -20, -30],
            opacity: [0, 1, 0],
            scale: [0, 1, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeOut"
          }}
        />
      </motion.div>
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
      {PRIZES.map((prize, idx) => (
        <div key={prize.id} className={`snap-center shrink-0 w-[110px] bg-white rounded-xl p-3 border ${prize.id === 'gold' ? 'border-amber-400 shadow-md ring-1 ring-amber-100' : 'border-stone-100 shadow-sm'} flex flex-col items-center relative`}>
          {prize.id === 'gold' && (
            <div className="absolute top-0 right-0 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg shadow-sm">TOP</div>
          )}
          <div className={`w-8 h-8 rounded-full ${prize.color} ${prize.border} border shadow-inner mb-2`}></div>
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

// 隱藏彩蛋 Modal：LINE 密語
const SecretModal = ({ onClose }: { onClose: () => void }) => (
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
          就能獲得「再轉一次」的機會喔。
        </p>
        <a
          href={ASSETS.lineLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => ReactGA.event({ category: "Conversion", action: "click_line_link", label: "Secret Modal Line Link" })}
          className="w-full py-3 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>前往 LINE 輸入密語</span>
        </a>
      </div>
    </motion.div>
  </motion.div>
);


// 點擊轉蛋後的活動 Modal：單張籤詩風格 (Unified Card Style)
const EventModal = ({ onClose }: { onClose: () => void }) => {
  const [fortune] = useState(() => FORTUNES[Math.floor(Math.random() * FORTUNES.length)]);

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
        <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-red-800 via-red-600 to-red-800 opacity-90"></div>

        <div className="p-8 w-full flex flex-col items-center">
          {/* 1. Fortune Content */}
          <div className="text-center mb-8 relative w-full">
            {/* Watermark/Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-red-50 rounded-full blur-2xl -z-10 opacity-60"></div>

            {/* Level Badge */}
            <span className={`inline-block px-4 py-1 rounded-full text-xs font-bold tracking-[0.2em] mb-6 border ${fortune.level === '隱藏版' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              fortune.level === '大吉' ? 'bg-red-50 text-red-800 border-red-200' :
                fortune.level === '中吉' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-stone-50 text-stone-600 border-stone-200'
              }`}>
              {fortune.level}
            </span>

            {/* Text */}
            <p className="text-stone-800 font-serif font-medium text-xl leading-relaxed tracking-wide px-2">
              「{fortune.text}」
            </p>
          </div>

          {/* Divider */}
          <div className="w-12 h-[1px] bg-stone-200 mb-6"></div>

          {/* 2. Event Description */}
          <div className="text-center mb-6">
            <p className="text-stone-500 text-xs tracking-wider mb-2 font-medium">✨ Kiwimu ✨</p>
            <p className="text-stone-700 text-sm leading-7">
              在 Google 地圖<br />
              留下<span className="text-red-600 font-bold mx-1">五星好評</span><br />
              即可現場兌換好運獎勵
            </p>
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
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
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
  const [showEventModal, setShowEventModal] = useState(false);

  // Track Page View
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

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
            <GaraponAnimation onClick={() => {
              ReactGA.event({ category: "Interaction", action: "click_garapon", label: "Open Event Modal" });
              setShowEventModal(true);
            }} />
          </div>

          <AnimatePresence>
            {showSecretModal && <SecretModal onClose={() => setShowSecretModal(false)} />}
            {showEventModal && <EventModal onClose={() => setShowEventModal(false)} />}
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