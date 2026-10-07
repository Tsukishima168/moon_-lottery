# Gacha Current

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
