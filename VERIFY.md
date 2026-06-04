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
