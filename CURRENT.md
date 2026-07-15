# Gacha Current

Last updated: 2026-07-15

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
