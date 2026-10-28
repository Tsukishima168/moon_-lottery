// LINE 分享（src/lib/liffShare.ts）的小型 node 檢查（gacha 沒有測試 runner）。
// 用法：node scripts/test-line-share.mjs
// 把 liffShare.ts 轉成 ESM，換掉 @line/liff 與 import.meta.env 後逐案例實際執行；不連網、不開瀏覽器。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const src = readFileSync(new URL('../src/lib/liffShare.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
  .replace(/import liff from ['"]@line\/liff['"];?/, 'const liff = globalThis.__liff;')
  .replace('import.meta.env.VITE_LINE_LIFF_ID', 'globalThis.__LIFF_ID');
assert.ok(js.includes('globalThis.__liff') && js.includes('globalThis.__LIFF_ID'), 'stub replacement failed');

// 真實的 User-Agent（桌機／手機各幾種）；LINE 的 line.me/R/share 對桌機 Chrome／Firefox／Edge 會 302 到首頁。
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  androidPhone: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  androidTablet: 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  macChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  winEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
  firefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:132.0) Gecko/20100101 Firefox/132.0',
};

let seq = 0;
async function load({ liffId, liff = {}, ua = UA.iphone, platform = 'iPhone', maxTouchPoints = 5, uaDataMobile, clipboard = 'ok', blocked = false }) {
  const opened = [];
  const copied = [];
  globalThis.__LIFF_ID = liffId;
  globalThis.__liff = liff;
  const nav = { userAgent: ua, platform, maxTouchPoints };
  if (uaDataMobile !== undefined) nav.userAgentData = { mobile: uaDataMobile };
  if (clipboard === 'ok') nav.clipboard = { writeText: async (t) => { copied.push(t); } };
  else if (clipboard === 'reject') nav.clipboard = { writeText: async () => { throw new Error('denied'); } };
  // clipboard === 'none'：不提供 navigator.clipboard（例如非 https）
  Object.defineProperty(globalThis, 'navigator', { value: nav, configurable: true, writable: true });
  globalThis.window = { open: (url, target) => { opened.push({ url, target }); return blocked ? null : { opener: {} }; } };
  const mod = await import(`data:text/javascript;base64,${Buffer.from(`${js}\n//${seq++}`).toString('base64')}`);
  return { ...mod, opened, copied };
}
const decodeText = (url) => new URL(url).searchParams.get('text');
const SHARE_PREFIX = 'https://line.me/R/share?text=';
const silent = (fn) => async (...a) => { const w = console.warn, l = console.log, e = console.error; console.warn = console.log = console.error = () => {}; try { return await fn(...a); } finally { console.warn = w; console.log = l; console.error = e; } };

// ── 手機 ──────────────────────────────────────────────
// 1. 沒有 LIFF ID：開 LINE 官方分享網址，文字用現行站名並附網址，不再出現舊站名
{
  const { sharePullToLine, opened, copied } = await load({ liffId: undefined });
  const result = await sharePullToLine('銀球', 10);
  assert.equal(result.ok, true);
  assert.equal(opened.length, 1);
  assert.equal(copied.length, 0);
  assert.ok(opened[0].url.startsWith(SHARE_PREFIX));
  assert.equal(opened[0].target, '_blank');
  const text = decodeText(opened[0].url);
  assert.ok(text.includes('月島・遊戲中心') && text.includes('「銀球」') && text.includes('https://gacha.kiwimu.com'));
  assert.ok(text.includes('獲得 10 遊戲積分'));
  assert.ok(!text.includes('開運所'));
}
// 2. iPhone、Android 手機、Android 平板、iPadOS（Mac UA＋觸控）、userAgentData.mobile 都走 line.me/R/share
for (const opts of [
  { ua: UA.iphone },
  { ua: UA.androidPhone, platform: 'Linux armv81' },
  { ua: UA.androidTablet, platform: 'Linux armv81' },
  { ua: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 5 },
  { ua: UA.winChrome, platform: 'Win32', maxTouchPoints: 0, uaDataMobile: true },
]) {
  const { sharePullToLine, opened, copied } = await load({ liffId: undefined, ...opts });
  const result = await sharePullToLine('金球', 25);
  assert.equal(result.ok, true, `mobile ${opts.ua}`);
  assert.equal(opened.length, 1, `mobile ${opts.ua}`);
  assert.ok(opened[0].url.startsWith(SHARE_PREFIX), `mobile ${opts.ua}`);
  assert.equal(copied.length, 0);
}
// 3. 非積分獎品（券、印章、免費機會）不寫「獲得 N 積分」
for (const points of [undefined, 0]) {
  const { sharePullToLine, opened } = await load({ liffId: undefined });
  await sharePullToLine('飲品折扣券預覽', points);
  assert.ok(!decodeText(opened[0].url).includes('獲得'));
}
// 4. 手機視窗被擋：回報失敗與提示，不丟例外
{
  const { sharePullToLine } = await load({ liffId: undefined, blocked: true });
  const result = await sharePullToLine('金球', 25);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'popup_blocked');
  assert.ok(result.message.includes('彈出視窗'));
}

// ── 桌機（line.me/R/share 會被轉到 LINE 首頁，所以不能開那個網址、也不能顯示「已開啟 LINE 分享」）──
// 5. 桌機各瀏覽器：複製分享文字，不開任何視窗，提示要說「已複製」
for (const [name, opts] of Object.entries({
  macChrome: { ua: UA.macChrome, platform: 'MacIntel', maxTouchPoints: 0 },
  macSafari: { ua: UA.macSafari, platform: 'MacIntel', maxTouchPoints: 0 },
  winChrome: { ua: UA.winChrome, platform: 'Win32', maxTouchPoints: 0, uaDataMobile: false },
  winEdge: { ua: UA.winEdge, platform: 'Win32', maxTouchPoints: 10 },
  firefox: { ua: UA.firefox, platform: 'MacIntel', maxTouchPoints: 0 },
})) {
  const { sharePullToLine, opened, copied } = await load({ liffId: undefined, ...opts });
  const result = await sharePullToLine('銀球', 10);
  assert.equal(opened.length, 0, `desktop ${name}: must not open line.me/R/share (it redirects desktop browsers to the LINE home page)`);
  assert.equal(copied.length, 1, `desktop ${name}: share text must be copied`);
  assert.ok(copied[0].includes('月島・遊戲中心') && copied[0].includes('「銀球」') && copied[0].includes('獲得 10 遊戲積分') && copied[0].includes('https://gacha.kiwimu.com'), `desktop ${name}`);
  assert.equal(result.ok, true, `desktop ${name}`);
  assert.ok(result.message.includes('已複製') && !result.message.includes('已開啟'), `desktop ${name}: message must say copied, not "opened LINE share"`);
}
// 6. 桌機複製失敗或沒有 clipboard：退回 LINE 網頁版分享（只帶網址），訊息照實說需要登入
for (const clipboard of ['reject', 'none']) {
  const { sharePullToLine, opened, copied } = await load({ liffId: undefined, ua: UA.macChrome, platform: 'MacIntel', maxTouchPoints: 0, clipboard });
  const result = await silent(sharePullToLine)('銀球', 10);
  assert.equal(copied.length, 0);
  assert.equal(opened.length, 1, clipboard);
  assert.equal(opened[0].url, 'https://social-plugins.line.me/lineit/share?url=https%3A%2F%2Fgacha.kiwimu.com');
  assert.equal(result.ok, true);
  assert.ok(result.message.includes('登入') && result.message.includes('連結'), clipboard);
}
// 7. 桌機複製失敗、網頁版視窗又被擋：回報被擋
{
  const { sharePullToLine } = await load({ liffId: undefined, ua: UA.winChrome, platform: 'Win32', maxTouchPoints: 0, clipboard: 'reject', blocked: true });
  const result = await silent(sharePullToLine)('銀球', 10);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'popup_blocked');
}

// ── LIFF ─────────────────────────────────────────────
// 8. 有 LIFF ID 且在 LINE 內：維持 LIFF shareTargetPicker，不開網址也不複製；訊息不含舊站名
{
  let sent;
  const liff = {
    init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => true,
    shareTargetPicker: async (messages) => { sent = messages; return { status: 'success' }; },
  };
  const { sharePullToLine, opened, copied } = await load({ liffId: 'test-liff', liff });
  const result = await silent(sharePullToLine)('金球', 25);
  assert.equal(result.ok, true);
  assert.equal(opened.length, 0);
  assert.equal(copied.length, 0);
  const flex = JSON.stringify(sent);
  assert.ok(flex.includes('月島・遊戲中心') && flex.includes('獲得 25 遊戲積分') && !flex.includes('開運所'));
  assert.ok(flex.includes('https://gacha.kiwimu.com'));
}
// 9. LIFF 使用者取消：視為取消，不再另開網址或複製
{
  const liff = { init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => true, shareTargetPicker: async () => undefined };
  const { sharePullToLine, opened, copied } = await load({ liffId: 'test-liff', liff });
  const result = await silent(sharePullToLine)('銅球', 5);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'cancelled');
  assert.equal(opened.length, 0);
  assert.equal(copied.length, 0);
}
// 10. LIFF 無法使用（初始化失敗／未登入／沒有 shareTargetPicker／丟例外）：手機改走分享網址、桌機改成複製
const brokenLiffs = [
  { init: async () => { throw new Error('init'); }, isLoggedIn: () => true, isApiAvailable: () => true },
  { init: async () => {}, isLoggedIn: () => false, isApiAvailable: () => true },
  { init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => false },
  { init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => true, shareTargetPicker: async () => { throw new Error('boom'); } },
];
for (const liff of brokenLiffs) {
  const { sharePullToLine, opened, copied } = await load({ liffId: 'test-liff', liff });
  const result = await silent(sharePullToLine)('青球', 50);
  assert.equal(result.ok, true);
  assert.equal(opened.length, 1);
  assert.equal(copied.length, 0);
  assert.ok(decodeText(opened[0].url).includes('https://gacha.kiwimu.com'));
}
for (const liff of brokenLiffs) {
  const { sharePullToLine, opened, copied } = await load({ liffId: 'test-liff', liff, ua: UA.winChrome, platform: 'Win32', maxTouchPoints: 0 });
  const result = await silent(sharePullToLine)('青球', 50);
  assert.equal(result.ok, true);
  assert.equal(opened.length, 0, 'desktop with unusable LIFF must not open line.me/R/share');
  assert.equal(copied.length, 1);
  assert.ok(result.message.includes('已複製'));
}
console.log('LINE share: mobile URL path, desktop copy + web-share fallback, LIFF path kept, points line, popup-blocked and cancel cases passed.');
