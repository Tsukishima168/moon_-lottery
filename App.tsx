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
  lineLink: "https://lin.ee/xhxnUdX",
  instagramLink: "https://www.instagram.com/moonmoon_dessert/" // Placeholder IG Link
};

const REVIEWS = [
  "今天的幸運色是黃色！來點芒果甜點吧！",
  "適合與朋友分享的一天，買二送一優惠等你拿！",
  "享受獨處的時光，一杯咖啡配蛋糕剛剛好。",
  "發現生活中的小確幸，就在月島甜點。",
  "好運正在發生，轉角遇到美味。",
  "甜蜜滋味，撫慰一整天的辛勞。",
  "來一份限定甜點，犒賞努力的自己。",
  "帶著笑容，好運自然會跟著你。",
  "分享這份甜蜜，讓快樂加倍。",
  "今天的你，比甜點還要甜！"
];

const PRIZES = [
  "免費配料一份",
  "飲品折價 10 元",
  "甜點 9 折優惠",
  "神秘小禮物"
];

// --- Components ---

// 日式搖珠機 (Garapon) 動畫元件 - Make it Interactive!
const GaraponAnimation = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.div
      className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Click Hint Tooltip */}
      <div className="absolute -top-8 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
        點我查看活動！
        <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-t-[6px] border-t-red-600 border-b-[0px] border-b-transparent"></div>
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
        {/* Hexagon Shape using SVG */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
          <path d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" fill="#B91C1C" stroke="#991B1B" strokeWidth="2" />
          {/* Wooden Side Panels */}
          <path d="M6.7 25 L50 0 L50 100 L6.7 75 Z" fill="#F59E0B" fillOpacity="0.2" />
          {/* Center Pivot */}
          <circle cx="50" cy="50" r="5" fill="#1C1917" />
        </svg>
      </motion.div>

      {/* Handle (Animated) */}
      <motion.div
        className="absolute z-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-1 h-12 bg-stone-400 origin-top translate-y-[-2px]"></div>
        <div className="w-3 h-3 bg-stone-900 rounded-full translate-x-[-4px] translate-y-10"></div>
      </motion.div>

      {/* Dropping Ball Animation */}
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
  );
};

const PrizeTicker = ({ onSecretClick }: { onSecretClick: () => void }) => {
  return (
    <div className="w-full overflow-hidden bg-stone-100 py-2 relative flex items-center mb-6">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...PRIZES, ...PRIZES, ...PRIZES].map((prize, index) => (
          <div key={index} className="mx-4 flex items-center space-x-2 text-stone-600 text-sm font-medium">
            <Gift size={14} className="text-red-500" />
            <span>{prize}</span>
          </div>
        ))}
        {/* Hidden Secret Trigger */}
        <div
          onClick={onSecretClick}
          className="mx-4 flex items-center space-x-2 text-transparent text-sm font-medium cursor-pointer select-none"
        >
          <span>Secret</span>
        </div>
      </div>
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-stone-50 to-transparent z-10"></div>
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-stone-50 to-transparent z-10"></div>
    </div>
  );
};

const Toast = ({ show }: { show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-stone-800 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm"
      >
        <CheckCircle className="w-4 h-4 text-green-400" />
        <span>已複製！即將前往 Google Maps...</span>
      </motion.div>
    )}
  </AnimatePresence>
);

const SecretModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/90 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-stone-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl relative border border-stone-700 overflow-hidden text-center"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500"></div>

      <img
        src={ASSETS.secretImage}
        alt="Secret Character"
        className="w-32 h-32 mx-auto mb-6 rounded-full border-4 border-stone-700 shadow-xl object-cover"
      />

      <h3 className="text-2xl font-black text-white mb-2 tracking-widest">HIDDEN UNLOCKED!</h3>
      <p className="text-stone-400 text-sm mb-6 leading-relaxed">
        恭喜發現隱藏彩蛋！<br />
        其實... 我們一直在等你。
      </p>

      <button
        onClick={onClose}
        className="px-6 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-full text-sm font-bold transition-colors"
      >
        保守秘密
      </button>
    </motion.div>
  </motion.div>
);

const EventModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: 20, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="bg-red-50 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border-4 border-red-100/50 overflow-hidden"
    >
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-200/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/50 text-stone-400 hover:bg-white transition-colors z-10"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center text-center relative z-0">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-700 mb-4 flex items-center justify-center shadow-lg border-4 border-white text-3xl">
          🧧
        </div>

        <h3 className="text-xl font-black text-red-800 mb-2 tracking-wide">春節好運轉轉樂</h3>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed font-medium">
          新年快樂！<br />
          只要在 Google 地圖完成<span className="text-red-600 font-bold mx-1">五星好評</span><br />
          即可現場兌換轉蛋機中的好禮！
        </p>

        <div className="w-full space-y-3">
          <a
            href={ASSETS.instagramLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => ReactGA.event({ category: "Conversion", action: "click_ig_link", label: "Event Modal IG Link" })}
            className="w-full py-3.5 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-all text-sm"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            <span>追蹤 Instagram 獲取最新優惠</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-white border border-stone-200 text-stone-600 rounded-xl font-bold hover:bg-stone-50 transition-colors text-sm"
          >
            知道了，馬上參加！
          </button>
        </div>

      </div>
    </motion.div>
  </motion.div>
);

export default function App() {
  const [review, setReview] = useState(REVIEWS[0]);
  const [isCopied, setIsCopied] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Track Page View
  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  const handleShuffle = () => {
    ReactGA.event({ category: "Interaction", action: "shuffle_review", label: "Refresh Review Text" });
    const randomIndex = Math.floor(Math.random() * REVIEWS.length);
    setReview(REVIEWS[randomIndex]);
  };

  const handleCopyAndRedirect = () => {
    ReactGA.event({ category: "Conversion", action: "copy_and_redirect", label: "Copy Review & Go to Google Maps" });
    navigator.clipboard.writeText(review);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset toast after 2s

    // Redirect after a short delay to let user see the toast
    setTimeout(() => {
      window.open(ASSETS.googleMapsLink, '_blank');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col font-sans selection:bg-red-100 selection:text-red-900 pb-24 sm:pb-0">

      {/* Background Texture */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
      ></div>

      <main className="flex-grow w-full max-w-md mx-auto px-6 py-8 relative z-10 flex flex-col items-center">

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
          <span className="text-[11px] font-medium text-amber-600">③ 到店兌獎</span>
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