export interface Fortune {
  id: number;
  level: string;
  text: string;
  example: string;
  action: string;
}

// Keep the ten existing IDs so today's saved result can still be opened.
export const FORTUNES: Fortune[] = [
  { id: 1, level: '大吉', text: '你願意開始的那一小步，就是今天的好運。', example: '想做的事一直放在清單裡？不必一次做完，先打開文件、寫下一句，就已經開始。', action: '挑一件掛在心上的事，留五分鐘給它。' },
  { id: 2, level: '中吉', text: '慢一點，也能把日子過得剛剛好。', example: '午休不用急著回訊息。好好吃完一口飯，再決定接下來要做什麼。', action: '今天給自己一段不看手機的十分鐘。' },
  { id: 3, level: '大吉', text: '被你照顧的小事，也會慢慢照顧你。', example: '替桌上的植物澆水、把水杯裝滿，這些微小的照顧會讓忙碌的一天多一點餘裕。', action: '替你的日常，完成一件小小的照顧。' },
  { id: 4, level: '吉', text: '好運有時，是一句剛好說出口的問候。', example: '想到很久沒聯絡的朋友時，可以先傳一句「今天突然想到你」，不必等到有大事才開口。', action: '給一位你在意的人，一句沒有任務的問候。' },
  { id: 5, level: '大吉', text: '今天，你可以相信自己已經走過的路。', example: '遇到不熟悉的工作時，想想上次你如何解開一個難題。你不必什麼都會，仍然可以慢慢找到方法。', action: '記下一件最近做得不錯的事。' },
  { id: 6, level: '中吉', text: '留一點空白，讓喜歡的事有地方進來。', example: '行程之間空出十五分鐘，可能剛好夠你散個步、喝杯茶，或什麼都不做。', action: '在今天的行程裡，留下十五分鐘的空白。' },
  { id: 7, level: '吉', text: '不必獨自完成的事，就讓人陪你一段。', example: '卡住時問同事一句「可以陪我看一下嗎」，往往比自己反覆猜測更快找到方向。', action: '對一件卡住的事，提出一個具體的求助。' },
  { id: 8, level: '小吉', text: '平凡的一天，也值得被好好記住。', example: '路上的一束光、剛好的咖啡溫度，或有人替你留門，都是今天可以收下的小片刻。', action: '睡前寫下今天一件讓你舒服的小事。' },
  { id: 9, level: '大吉', text: '喜歡的事，不一定要等到有空才輪到。', example: '想看一本書，可以先讀兩頁；想去散步，也可以只走到街角。小份量的喜歡一樣算數。', action: '把一件喜歡的事，放進今天的十分鐘。' },
  { id: 10, level: '隱藏版', text: '今天的你，值得一份沒有理由的小獎勵。', example: '即使沒有完成所有待辦，也可以泡杯喜歡的茶、聽一首歌，好好結束今天。', action: '挑一件讓你開心的小事，送給自己。' },
];

export const JACKPOT_FORTUNE: Fortune = {
  id: 999, level: '隱藏版', text: '月光球來了，收下這份剛好遇見的驚喜。',
  example: '今天抽到 200 本機遊戲積分。把這份小驚喜當作停下來微笑的理由，也留一點時間給自己。',
  action: '記住今天這個小片刻，再做一件讓你開心的事。',
};

export function findSavedFortune(fortuneId: unknown, prizeId: unknown): Fortune | null {
  if (fortuneId === 999) return prizeId === 'jackpot' ? JACKPOT_FORTUNE : null;
  return FORTUNES.find((fortune) => fortune.id === fortuneId) ?? null;
}
