# Gacha Verify

Last updated: 2026-06-04

## Minimum Local Verification

```bash
npm run build
```

Use this additional check when editing TypeScript-heavy logic and no dedicated test exists:

```bash
npx tsc --noEmit
```

## Preview Smoke

```bash
npm run preview -- --host 127.0.0.1 --port 4130
```

Check these paths:

- `http://127.0.0.1:4130/`
- `http://127.0.0.1:4130/robots.txt`
- `http://127.0.0.1:4130/sitemap.xml`
- `http://127.0.0.1:4130/llms.txt`

## Browser Checks

- No blank screen on first load.
- Daily draw UI renders with text labels and point values.
- Lucky wheel renders with reward codes or text labels, not emoji.
- Point balance renders when Supabase env is present.
- Missing Supabase env shows a warning/degraded state instead of crashing.
- Login CTA routes to Passport SSO.
- Share action is guarded when `VITE_LINE_LIFF_ID` is missing or not inside LINE.

## Emoji Regression Check

Customer-facing source should not contain emoji reward labels.

Use a source scan before release:

```bash
find App.tsx src -type f \( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \) -print0 | xargs -0 perl -CS -ne 'print "$ARGV:$.:$_" if /\p{Extended_Pictographic}/'
```

Expected result: no customer-facing reward label regressions. If the scan prints matches, inspect each one manually and keep only intentional non-UI assets or external metadata.

## Production Smoke

After deploy, verify:

- `https://gacha.kiwimu.com/`
- `https://gacha.kiwimu.com/robots.txt`
- `https://gacha.kiwimu.com/sitemap.xml`
- `https://gacha.kiwimu.com/llms.txt`

Production-only checks:

- Passport SSO session can be detected after login.
- Points sync handoff to Passport works.
- LIFF share works inside LINE after the LIFF ID is configured.
- GA4 events include `site_id: gacha`.

## GA4: shared rail event `universe_nav_click`

The shared Kiwimu Universe rail (`src/components/KiwimuUniverseRail.tsx`, byte-identical across the five sites) reports every rail link click as `universe_nav_click` through `trackEvent` in `src/lib/crossSiteTracking.ts`. **The rail no longer sends `outbound_click`** (the old `link_name=universe_rail_<id>`, `entry_surface=gacha_universe_rail`, `destination_type=internal` history ends at the cutover; `outbound_click` is still sent by non-rail links such as the member-journey return link in `App.tsx`).

12 parameters, plus `site_id: gacha` added by `trackEvent`:

| Parameter | Value |
|---|---|
| `source_site` | `gacha` |
| `target_site` | `kiwimu` / `passport` / `map` / `gacha` / `shop` / `canopy` |
| `viewport`, `viewport_width`, `viewport_height` | e.g. `390x844`, `390`, `844` |
| `viewport_category` | `mobile` (<=640) / `tablet` (<=1024) / `desktop` / `unknown` |
| `login_status` | `authenticated` / `anonymous` / `unknown` (read once at mount via `readSupabaseLoginStatus(getAuthClient())`; `unknown` when Supabase env is missing) |
| `surface`, `entry_surface` | `universe_rail` |
| `link_name` | `MBTI` / `Passport` / `Map` / `Gacha` / `Shop` / `Canopy` |
| `destination_type` | `cross_site_nav` (five sites) / `external` (forest exhibition) |
| `transport_type` | `beacon` |

The link to the current site (gacha) also fires the event with `source_site = target_site`; filter with `source_site != target_site` for cross-site analysis. In reports, custom dimensions for the new parameters must be registered in GA4 separately.

Local check (no network needed): load the production preview with a stub `window.gtag`, click a rail link, and read the event from the stub.

## Release Gate

Before push:

```bash
git diff --check
npm run build
```

Before claiming campaign readiness:

- Complete browser checks.
- Confirm no emoji reward label regression.
- Confirm point sync behavior with a real Passport session.
