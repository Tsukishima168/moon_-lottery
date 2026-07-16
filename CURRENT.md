# Gacha Current

Last updated: 2026-07-16

## Economy v2 adapter · Draft

- Branch: `codex/gacha-economy-v2-adapter-20260716`
- Gacha no longer treats localStorage, a device id, URL parameters, CustomEvent, or client RPC amounts as point authority.
- Daily Gacha calls `play_daily_gacha`; the wheel calls `spin_reward_wheel`; wallet display calls `economy_get_wallet`.
- The client sends only a request UUID. Daily limits, costs, weighted RNG, point spends, rewards and idempotency are canonical Shop/Supabase responsibilities.
- A `0` server balance remains `0`; there is no fallback to anonymous/local points.
- The Supabase client fails closed unless it targets `xlqwfaailjyvsycjnzkz.supabase.co`.
- Static prize data is presentation-only. Unknown server prize codes use a neutral Kiwimu style and never create an asset.
- Status: implementation and review in progress. Do not merge or deploy before the Shop migration/rollout gates below pass.

## Release gates

1. Shop remains the only shared migration publisher.
2. Hosted migration history, dry-run, RLS, grants, search path and PostgREST exposure must pass.
3. Gacha configs and prize rows are seeded but disabled until dedicated-account canary.
4. Test replay, concurrent spend/reward and ledger reconciliation; mismatch must remain zero.
5. Enable `gacha` read/write by dedicated account, then 10% → 50% → 100%, at least 24 hours and 20 valid events per stage.
6. Any duplicate reward, negative balance, unknown project ref or ledger mismatch closes the rollout flag immediately.

## Five-site visual system · shipped 2026-07-15

- Shared Kiwimu Universe rail and `04 / Play & fortune` role label are live while preserving Gacha's paper-grid and heavy-border language.
- The sticky auth bar, mobile rail, wheel overlay stacking and 44px close target passed desktop and 390px QA.
- Visual PR #18 merged as `b859f279d5f14e6317af0c5ea949fd29f29ff476`.

## Operational boundary

- Gacha owns campaign presentation and game animation.
- Shop/Supabase owns game rules, RNG, point ledger, costs, rewards, idempotency and rollout flags.
- Passport owns identity, wallet history and reward redemption.
- Map owns store/location presentation and staff-confirmed visit proof UX.
- Kiwimu owns quiz/content UX and submits completion evidence without choosing a reward amount.

## Important files

- `App.tsx`: authenticated daily-game UX and authoritative wallet display.
- `src/components/LuckyWheel.tsx`: server-result wheel animation.
- `src/lib/economy.ts`: strict Economy RPC adapter and response parser.
- `wheelService.ts`: presentation-only prize-code styles; no RNG or asset mutation.
- `src/lib/auth.ts`: shared Supabase auth client and target-project validation.
- `docs/ECONOMY_V2_ADAPTER.md`: contract, security boundary and release dependencies.

## Known limitations

- Canonical Economy migrations are not deployed to production yet; rollout flags remain off.
- Supabase preview branches are unavailable on the current plan (HTTP 402 / Pro required), so hosted validation needs an approved alternative before production push.
- LIFF sharing still requires a real LINE client smoke test before public claims.
- Old anonymous/local points are intentionally not imported 1:1.

## Verification

```bash
npm run test:economy
npm run build
```

Also scan production source for `Math.random`, local point writes, `p_points`, Passport `amount` URLs and `kiwimu:points_earned`; none may remain on an asset path.
