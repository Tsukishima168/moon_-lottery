# BOOT.md — moonmoon-gacha · 冷啟動快照

> 每次新開對話，先讀這份文件。

---

## 專案定位

**月島・開運所**（gacha.kiwimu.com）— Kiwimu 生態系的遊戲互動中心。

功能：每日限抽一次轉蛋機（積分制）＋幸運轉盤。抽獎結果換成積分，積分可在 passport.kiwimu.com 兌換甜點品項。

前身是實體獎品活動頁，現已轉型為純積分型遊戲中心。

---

## 技術堆疊

| 層 | 技術 |
|----|------|
| 框架 | Vite 6 + React 19 + TypeScript 5.8（純 SPA，無 SSR） |
| 樣式 | Tailwind CSS v4 + shadcn（Kiwimu 客製元件在 `src/components/kiwimu/`） |
| 動畫 | Framer Motion 12 |
| 資料庫 | Supabase（`moonisland` project，anon key） |
| Auth | 跨子網域 cookie（`.kiwimu.com`）讀取 Passport SSO session |
| 積分寫入 | Supabase RPC `upsert_point_transaction(user_id, ...)` |
| LINE 分享 | LIFF（**lazy init**，只在用戶點分享時才初始化） |
| Analytics | GA4（react-ga4），手動 `page_view`，`index.html` 關閉自動送出 |
| 部署 | Vercel，`main` 分支自動部署 |
| PWA | vite-plugin-pwa（有 service worker） |

---

## 開工前先讀

1. **`App.tsx`** — 主應用程式入口，包含抽獎邏輯、積分 UI、每日限制控制
2. **`pointsSystem.ts`** — localStorage 本地積分 + Supabase 雲端同步邏輯
3. **`wheelService.ts`** — 幸運轉盤服務邏輯
4. **`src/lib/supabase.ts`** — Supabase client（cookie storage 設定）
5. **`src/lib/auth.ts`** — Google OAuth + SSO cookie 讀取

---

## 目前 Git 狀態（快照：2026-04-01）

```
branch:  feat/game-center-wheel
origin:  in sync
HEAD:    bbdb9f0  feat(ui): integrate Tailwind v4 and shadcn Kiwimu components
```

**⚠️ 重要：目前在 `feat/game-center-wheel` 分支，尚未 merge 到 `main`。**

Vercel production 仍是 `main`（舊版），此分支的遊戲中心改版尚未上線。

### 未提交的 dirty 狀態

| 檔案 | 狀態 | 說明 |
|------|------|------|
| `App.tsx` | modified | import 路徑改為 `src/components/*`，並改用 `kiwimuToast` |
| `components/GameCard.tsx` | deleted | 舊位置元件移除 |
| `components/LuckyWheel.tsx` | deleted | 舊位置元件移除 |
| `src/components/GameCard.tsx` | untracked | `GameCard` 新位置 |
| `src/components/LuckyWheel.tsx` | untracked | `LuckyWheel` 新位置 |
| `BOOT.md` | untracked | 本專案冷啟動快照 |

→ 目前 dirty 是同一批收斂中的改動：把兩個元件移到 `src/components/`，並讓 `App.tsx` 對齊新路徑與統一 toaster。不是隨機雜訊。

### 驗證狀態（2026-04-01）

| 指令 | 結果 |
|------|------|
| `npm run build` | ✅ 通過 |
| `npx tsc --noEmit` | ✅ 通過 |

→ 以目前工作樹來看，這批改動已可驗證，若要做本地 canonical path 搬遷，建議先把這一批 coherent dirty 狀態定稿後再搬。

---

## 已知風險 / 未完成項目

| 項目 | 說明 |
|------|------|
| **分支尚未上線** | `feat/game-center-wheel` 完成後需 PR → main → Vercel deploy |
| **LIFF 只能在 LINE 環境測試** | 本機開啟會有 `LIFF initialization failed`（已改 lazy init，不影響主流程） |
| **PROJECT_PROGRESS.md 是廢棄快照** | 內部有舊機器路徑（`penstudio`、iCloud vault），不要參考，也不要修改 |
| **積分系統雙層架構** | localStorage 是本地快取，Supabase 是真相；未登入用戶積分**不會**同步上雲端 |
| **每日限制用 localStorage** | 跨裝置不同步，清快取可繞過（已知限制，暫時接受） |

---

## 環境變數（Vercel 已設定，本機需 `.env.local`）

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_LIFF_ID=
```

`.env.example` 有空白模板可參考。

---

## 收工注意

- 改完後執行 `npm run build` + `npx tsc --noEmit` 驗證
- commit 後確認此分支不要直接 push 到 main（需 PR）
