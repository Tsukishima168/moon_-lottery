# Gacha Current

## 2026-10-15｜五站風格升級 Phase B｜安裝共用森林導覽核心、統一 `universe_nav_click`

- 分支 `claude/style-upgrade-20261014`。`src/components/KiwimuUniverseRail.tsx` 與 `src/styles/kiwimu-universe.css` 換成 rail kit（與 kit 的 sha256 相同，`verify-rail.mjs --scan` PASS）。遊戲、抽獎、積分、auth 邏輯未動。
- 掛載（`index.tsx`）：`onTrack` 接既有 `trackEvent`（帶 `site_id:gacha`），`getLoginStatus` 用 `readSupabaseLoginStatus(getAuthClient())`（掛載時讀一次、無副作用、缺 Supabase env 時為 `unknown`）。
- 追蹤：rail 點擊改送 `universe_nav_click`（12 欄＋`site_id`），**rail 不再送 `outbound_click`**；欄位說明與 GA4 注意事項在 `VERIFY.md`。`crossSiteTracking.ts` 的 `trackOutboundClick` 仍供非 rail 連結使用。
- 站點 CSS：舊 rail CSS 內的 `#root button` 44px 與 `focus-visible` 兩條規則搬進 `src/index.css`（內容不變，仍為 3px）；`pwa-update.css` 的 `--ku-font-body` 改成直接寫字體。kit 不再 `@import` 字體，Google Fonts 樣式表整頁只剩 `index.html` 一條（Phase A 後為 2）。
- 手機（≤640px）「更多」依 kit 顯示「遊戲中心 ＋」並標示目前站，展開時 z-index 210；桌機 rail 與改動前逐像素相同。
- 主行動規則：淺色面深綠實心、深色面柔金。PWA 更新提示卡（奶油白）的「更新頁面」由柔金改為 `#1F2F1F` 底、`#F5F0E8` 字；深色 Hero 的柔金按鈕、紙面對話框原有的深綠主按鈕不變。
- 驗證：`npx tsc --noEmit`、`npm run build` exit 0；`scripts/` 三支 node 檢查與 kit 行為測試（161 項）通過；Playwright 於 1440／390／320 量 rail 與追蹤，首頁 1440 前後 0 差異、390 只有 rail 帶（「更多」欄）有差異，rail 以外 0。
- 限制：焦點環仍是 3px（`src/index.css` 全域與 `#root` 規則，搬移時未改，與 common.md 的 2px 規則不同，尚待決定）；本機沒有 Supabase env，`login_status` 只驗到 `unknown`；未真人 Safari／LINE，未登入、未抽獎。未 push、未開 PR、未部署。
- QA 證據：`/Users/pensoair/Desktop/Web-Projects/sites/.worktrees/style-20261014-qa/gacha/`（`DELIVERY.md` Phase B 一節、`results.json` 的 `phaseB`）。

## 2026-10-14｜五站風格升級 Phase A｜字體單一載入、rail 高度變數、reduced-motion catch-all

- 分支 `claude/style-upgrade-20261014`（base `origin/main` `833574c`）。gacha 是 10/14 驗收的五站標竿，這輪只修四項，遊戲、抽獎、積分、auth、共用 rail 檔與 rail 掛載一律未動。
- G1 字體：Noto Sans TC 與 JetBrains Mono 合併成 `index.html` 一條 Google Fonts 連結（字重 400／500／700／900 與 500／600／700 不變），刪掉 `src/index.css` 重複的 `@import`。Phase A 後字體 CSS 請求由 3 降為 2；剩下的一個來自 rail CSS，Phase B 整合 rail kit 時才處理。
- G2 `.gacha-page` 的 `min-height` 由寫死的 rail 高度數值改為 `calc(100dvh - var(--ku-rail-height))`。對該數值做 `git grep`（repo 內）為 0 筆；`.gacha-page` 最小高度 390 為 795px、1440 為 851px，與改動前相同。
- G3 `src/index.css` 的 `prefers-reduced-motion` 區塊加入全域 catch-all（animation／transition 壓到 0.01ms、animation 只跑 1 次、關掉 smooth scroll），既有 `.gacha-spinner`、`.gacha-button` 規則與 JS 的 `useReducedMotion` 保留。
- G4 `src/index.css` 的「黑色 rail」註解與 `design-qa.md` 兩處（rail 說明、顏色與狀態）改為森林綠版。
- 驗證：`npx tsc --noEmit` exit 0、`npm run build` exit 0（gacha repo 沒有 CI workflow，命令取自 `VERIFY.md`）；`scripts/` 三支 node 檢查通過。390（DPR2）與 1440 的首頁整頁、首屏、轉盤 dialog 前後截圖逐像素比對 0 差異；reduce 下首頁與轉盤 dialog 的 transition／animation >0.01ms 元素為 0。
- 誠實註記：reduce 下上述兩個畫面在改動前就已是 0（原有 `.gacha-button { transition: none }` 與 rail 自己的規則已涵蓋），這次是補上全域保證；用一個 inline `transition: all 1s` 的探針元素驗證，改動前仍是 1s、改動後被壓到 0.01ms。
- 未做：`html { scroll-padding-top: 64px }`、`.gacha-skip:focus { top: 60px }` 等與 rail 高度相近但不是同一個數值的設定未動；Phase B（rail 追蹤與 rail kit）待通知。未 push、未開 PR、未部署。
- QA 證據：`/Users/pensoair/Desktop/Web-Projects/sites/.worktrees/style-20261014-qa/gacha/`（`DELIVERY.md`、`results.json`、`before/`、`after/`）。

## 2026-10-07｜主對話收尾｜本機驗證完成，待獨立簽收與上線核定

- ✅ 主對話移除「可用積分以護照顯示為準」的不準確承諾。遊戲說明與兩個Passport回傳／前往提示改成會員可兌換積分／資格由門市確認；public/llms同步。`App.tsx:315`、`App.tsx:461`、`App.tsx:532`。
- ✅ 最終typecheck／build與actual-source AST／7auth mock通過；17保護檔相同，App effects除literal toast外相同。主對話rules／wheel預覽四種寬度無溢出、按鈕至少44px，0P未抽取，Esc回焦。
- 📌 自我更正：初版說明仍將Passport可能含本機紀錄的餘額當兌換依據，覆讀後修正；沒有修改同步／點數機制或假裝實體兌換已開放。
- ⚠️ 最終patch尚未獨立簽收（審查員額度限制）；未真人抽獎、登入、分享、加減點或兌換。
- 📌 最終交付索引與hash：/Users/pensoair/.codex/visualizations/2026/10/07/kiwimu-public-copy-repair/gacha/final-manifest.json；原作者證據保留為歷史，新的final-manifest才是送審版本。未部署；合併上線需Penso同意。


Last updated: 2026-10-07

## Public copy and dialog detail repair · 2026-10-07

- Goal: remove visitor-facing implementation/drafting wording and raw provider errors, and use deep-green primary actions on paper dialogs.
- Source: isolated worktree `/Users/pensoair/.codex/visualizations/2026/10/07/kiwimu-public-copy-repair/worktrees/gacha`, branch `codex/gacha-public-copy-repair-20261007`, base `origin/main` `41455f1`. Canonical main remains `8cd2983`; all seven pre-existing untracked duplicate files are preserved.
- Changed: `App.tsx` maps Passport error callbacks to customer wording while retaining diagnostic logging and busy reset; Passport navigation messages now describe viewing records without promising available points. LINE unavailable messages and insufficient-game-points feedback explain a useful next step.
- Changed: four paper-dialog primary actions use `#1F3527`; the gold daily Hero action, intentional desktop Hero `#142719`, mobile Hero `#1F3527`, artwork, shared Universe rail, handlers and failure gates remain unchanged.
- Changed: `index.html` semantic summary, `public/llms.txt` and `metadata.json` describe current gameplay rather than AI drafting instructions or the old review-generator concept. Local/member points separation, 30P cost, local-record limits and nonredeemable coupon/stamp previews remain explicit.
- Validation: TypeScript exit 0; production build passed; entry-from passed; 9 PWA controller + 4 cache fixtures passed; 17 saved-fortune cases passed; diff check passed. Actual-source AST/VM checks passed, including 7 auth-error display fixtures, daily pool/handler and App effects unchanged, wheel handler unchanged except toast text, LIFF behavior/reason contracts unchanged after message normalization, and 17 protected files byte-identical.
- Self-correction: SSOT still described the green version as local-only, but fresh Git verification found `origin/main` already at green source `41455f1`; this repair starts from that ref. The first CURRENT patch expected the older canonical heading and did not apply; this entry uses the freshly read worktree heading, retaining all history. The exported Supabase configuration warning is unused in visitor rendering, so auth configuration and failure gates were left byte-identical. Public reward previews were retained because they explain the current redemption limit.
- Evidence and backups: `/Users/pensoair/.codex/visualizations/2026/10/07/kiwimu-public-copy-repair/gacha/`. Backup files are outside the repo and are not deployment inputs. Local preview requested at `http://127.0.0.1:5234/`; no private env was copied.
- Limitations: no browser/visual verification or independent sign-off in this worker; no real login, draw, points change, sharing, stamp, redemption, order, payment, email, GPS or DB mutation. VM/PWA tests are fixtures, not live gameplay proof. No commit, push, merge or deployment. Next: fresh-context review of the frozen patch, then user review and any separately authorized release work.

## 月島深綠改版 · 2026-10-06

- 分支 `codex/gacha-map-green-20261006`（base＝main `8cd2983`）：Codex 作者的兩個 commit（窗邊遊戲台深綠介面＋敘事祝福、日常文案與手機入口）＋ Claude 配色統一修正。Codex 兩輪獨立審查 APPROVE（42＋4 VM 案例；App effects／handlers 與 12 個 economy／auth／sync 檔案 byte-identical）。
- Claude 配色統一：補 `<meta name="theme-color" content="#1F2F1F">`（原本沒有）；PWA manifest `theme_color` `#F5F0E8` → `#1F2F1F`，與 Map／Shop／Passport 一致。
- Claude 接手重驗：tsc exit 0、build exit 0、`scripts/test-saved-fortune.mjs` 通過；本機 preview 1280／768／390／320 無水平溢出、無 console error、按鈕 ≥44px；轉盤視窗 0 點時按鈕停用、Esc 關閉且焦點回到觸發按鈕；系統深色模式仍為奶油白＋深綠。舊配色元件（KiwimuButton／Card／Dialog／Badge、GameCard）未被引用，POINT_PRIZES／WHEEL_PRIZES 的色彩欄位未渲染。
- 未做：真實抽獎、加減點、Passport 同步、登入；實機 Safari／LINE 瀏覽器。
- 已上線（PR #28 squash `83369f6`，production Ready）。上線後補：手機版（≤900px）Hero 文字區 `#142719` → 規格 `#1F3527`，與 Shop／Passport Hero 一致；桌機維持 `#142719`，因 Hero 圖左側文字區取樣為 `#122216`，用來與圖片融合。
- PWA 更新：正式站回訪者會先看到「有新版本可以使用」，按「更新頁面」即換新版（本機以真實點擊重現驗證，可正常 reload 並啟用新 service worker）。

## Five-site visual system · 2026-07-15

- Added the shared Kiwimu Universe rail and `04 / Play & fortune` role label while preserving Gacha's paper-grid and heavy-border game language.
- Converted the auth bar to sticky flow and separated the role label from the points badge to avoid desktop/mobile collisions.
- Fresh-context review found the wheel's full-screen close header could sit under the rail; the shared rail now yields to full-screen gameplay, and the close control has a labelled 44px touch target.
- Verified `npx tsc --noEmit --pretty false`, `npm run build`, desktop and 390px browser QA, active-site centering, and zero page-level horizontal overflow/runtime console errors.
- No draw, wheel, points, Passport sync, or LIFF mutation was executed.
- Status: source changes are local and uncommitted; the pre-existing branch divergence (`ahead 3, behind 1`) remains untouched and no push/deployment was performed.

## Status

- Repository: `/Users/pensoair/Desktop/Web-Projects/sites/gacha-kiwimu-com`
- Current branch: `main`
- Remote tracking: `origin/main`
- Latest checked commit: `3559adc fix(gacha): replace wheel emoji with reward codes`
- Working tree at handoff: clean before this documentation pass
- Production role: campaign/game center, daily points draw, lucky wheel, Passport point sync, LINE share surface

## Stack

- App runtime: React 19 + Vite 6
- Styling: Tailwind CSS 4 plus Kiwimu/shadcn-style local components
- Motion: Framer Motion
- Data/auth: Supabase anon client and shared Passport SSO cookie/session
- Analytics: GA4 through `react-ga4` and local tracking helpers
- PWA: vite-plugin-pwa
- LINE: LIFF share is lazy-initialized when the user shares

## Operational Boundary

- Gacha owns campaign/game mechanics and point-award UX.
- Passport owns identity, persistent profile, and reward redemption surface.
- Shop owns checkout, payment, and order fulfillment.
- Map owns store/menu/location browsing.
- MBTI/Kiwimu owns quiz and content discovery.

## UI Language Rule

- Do not reintroduce emoji into customer-facing Gacha UI.
- Reward identifiers should be text labels, reward codes, icons, point values, colors, or structured badges.
- The latest checked code replaced wheel emoji with reward codes; preserve that direction in future changes.

## Important Files

- `App.tsx`: daily draw, point balance, sync prompts, main layout.
- `src/components/LuckyWheel.tsx`: wheel spend/earn flow and reward display.
- `pointsSystem.ts`: local point ledger and Passport sync URL helpers.
- `wheelService.ts`: wheel prize/config service logic.
- `src/lib/auth.ts`: shared Supabase auth client.
- `src/lib/liffShare.ts`: LINE share flow.
- `src/lib/crossSiteTracking.ts`: cross-site attribution.

## Known Risks

- Daily limit is localStorage based and can be bypassed by clearing storage.
- Unauthenticated users can use local points, but cloud sync requires Passport/Supabase session.
- LIFF behavior must be tested inside LINE before public claims.
- README still contains AI Studio boilerplate and is not the main operational source.
- Older BOOT content includes a historical feature-branch snapshot; use the 2026-06-04 overlay first.

## Next Work Queue

- Add fixture-backed smoke tests for daily draw and wheel result states.
- Keep point transaction action names aligned with shared Supabase schema.
- Validate production LIFF share once `VITE_LINE_LIFF_ID` is set.
- Keep Gacha campaign CTAs pointed to Passport redemption or Shop purchase flow as appropriate.

## 2026-07-08 升級輪（全面升級指令）
- 目標：S1 — TypeScript 升 6 + 計畫內修正
- 狀態：✅ 完成並簽收（60a50cf deps + ad8c3aa 源碼；tsc 0 錯、build 綠、react-ga4 移除）。未 push
- 下一步：Penso 同意後 push
