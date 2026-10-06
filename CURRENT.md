# Gacha Current

Last updated: 2026-10-06

## 月島深綠改版 · 2026-10-06

- 分支 `codex/gacha-map-green-20261006`（base＝main `8cd2983`）：Codex 作者的兩個 commit（窗邊遊戲台深綠介面＋敘事祝福、日常文案與手機入口）＋ Claude 配色統一修正。Codex 兩輪獨立審查 APPROVE（42＋4 VM 案例；App effects／handlers 與 12 個 economy／auth／sync 檔案 byte-identical）。
- Claude 配色統一：補 `<meta name="theme-color" content="#1F2F1F">`（原本沒有）；PWA manifest `theme_color` `#F5F0E8` → `#1F2F1F`，與 Map／Shop／Passport 一致。
- Claude 接手重驗：tsc exit 0、build exit 0、`scripts/test-saved-fortune.mjs` 通過；本機 preview 1280／768／390／320 無水平溢出、無 console error、按鈕 ≥44px；轉盤視窗 0 點時按鈕停用、Esc 關閉且焦點回到觸發按鈕；系統深色模式仍為奶油白＋深綠。舊配色元件（KiwimuButton／Card／Dialog／Badge、GameCard）未被引用，POINT_PRIZES／WHEEL_PRIZES 的色彩欄位未渲染。
- 未做：真實抽獎、加減點、Passport 同步、登入；實機 Safari／LINE 瀏覽器。

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
