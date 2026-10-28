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

let seq = 0;
async function load({ liffId, liff, openResult = {} }) {
  const opened = [];
  globalThis.__LIFF_ID = liffId;
  globalThis.__liff = liff;
  globalThis.window = { open: (url, target) => { opened.push({ url, target }); return openResult.blocked ? null : { opener: {} }; } };
  const mod = await import(`data:text/javascript;base64,${Buffer.from(`${js}\n//${seq++}`).toString('base64')}`);
  return { ...mod, opened };
}
const decodeText = (url) => decodeURIComponent(new URL(url).searchParams.get('text'));
const SHARE_PREFIX = 'https://line.me/R/share?text=';
const silent = (fn) => async (...a) => { const w = console.warn, l = console.log, e = console.error; console.warn = console.log = console.error = () => {}; try { return await fn(...a); } finally { console.warn = w; console.log = l; console.error = e; } };

// 1. 沒有 LIFF ID：改開 LINE 官方分享網址，文字用現行站名並附網址，不再出現舊站名
{
  const { sharePullToLine, opened } = await load({ liffId: undefined, liff: {} });
  const result = await sharePullToLine('銀球', 10);
  assert.deepEqual(result, { ok: true });
  assert.equal(opened.length, 1);
  assert.ok(opened[0].url.startsWith(SHARE_PREFIX));
  assert.equal(opened[0].target, '_blank');
  const text = decodeText(opened[0].url);
  assert.ok(text.includes('月島・遊戲中心') && text.includes('「銀球」') && text.includes('https://gacha.kiwimu.com'));
  assert.ok(text.includes('獲得 10 遊戲積分'));
  assert.ok(!text.includes('開運所'));
}
// 2. 非積分獎品（券、印章、免費機會）不寫「獲得 N 積分」
for (const points of [undefined, 0]) {
  const { sharePullToLine, opened } = await load({ liffId: undefined, liff: {} });
  await sharePullToLine('飲品折扣券預覽', points);
  assert.ok(!decodeText(opened[0].url).includes('獲得'));
}
// 3. 視窗被擋：回報失敗與提示，不丟例外
{
  const { sharePullToLine } = await load({ liffId: undefined, liff: {}, openResult: { blocked: true } });
  const result = await sharePullToLine('金球', 25);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'popup_blocked');
  assert.ok(result.message.includes('彈出視窗'));
}
// 4. 有 LIFF ID 且在 LINE 內：維持 LIFF shareTargetPicker，不開網址；訊息不含舊站名
{
  let sent;
  const liff = {
    init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => true,
    shareTargetPicker: async (messages) => { sent = messages; return { status: 'success' }; },
  };
  const { sharePullToLine, opened } = await load({ liffId: 'test-liff', liff });
  const result = await silent(sharePullToLine)('金球', 25);
  assert.deepEqual(result, { ok: true });
  assert.equal(opened.length, 0);
  const flex = JSON.stringify(sent);
  assert.ok(flex.includes('月島・遊戲中心') && flex.includes('獲得 25 遊戲積分') && !flex.includes('開運所'));
  assert.ok(flex.includes('https://gacha.kiwimu.com'));
}
// 5. LIFF 使用者取消：視為取消，不再另開網址
{
  const liff = { init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => true, shareTargetPicker: async () => undefined };
  const { sharePullToLine, opened } = await load({ liffId: 'test-liff', liff });
  const result = await silent(sharePullToLine)('銅球', 5);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'cancelled');
  assert.equal(opened.length, 0);
}
// 6. LIFF 無法使用（初始化失敗／未登入／沒有 shareTargetPicker／丟例外）：全部改走分享網址
for (const liff of [
  { init: async () => { throw new Error('init'); }, isLoggedIn: () => true, isApiAvailable: () => true },
  { init: async () => {}, isLoggedIn: () => false, isApiAvailable: () => true },
  { init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => false },
  { init: async () => {}, isLoggedIn: () => true, isApiAvailable: () => true, shareTargetPicker: async () => { throw new Error('boom'); } },
]) {
  const { sharePullToLine, opened } = await load({ liffId: 'test-liff', liff });
  const result = await silent(sharePullToLine)('青球', 50);
  assert.deepEqual(result, { ok: true });
  assert.equal(opened.length, 1);
  assert.ok(decodeText(opened[0].url).includes('https://gacha.kiwimu.com'));
}
console.log('LINE share: URL fallback (no LIFF id / LIFF unavailable), LIFF path kept, points line, popup-blocked and cancel cases passed.');
