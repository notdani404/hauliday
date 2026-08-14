# Deploying the web build to Vercel

`/apps/mobile` is an Expo app. Its **web** target (react-native-web) exports a
static SPA that Vercel hosts. Native iOS/Android ship later via EAS — Vercel is
web only. Camera/barcode work in-browser over HTTPS (getUserMedia).

## Vercel project settings

Import `notdani404/hauliday`, then:

| Setting | Value |
|---|---|
| **Root Directory** | `apps/mobile` |
| **Framework Preset** | Other |
| **Build Command** | `expo export -p web` (already in `vercel.json`) |
| **Output Directory** | `dist` (already in `vercel.json`) |
| **Install Command** | leave default — Vercel installs the pnpm workspace from the repo root |
| **Node.js Version** | 22 (matches `engines.node`) |

`vercel.json` also adds the SPA rewrite (`/(.*) → /index.html`); real assets under
`/_expo/static/*` are served directly (filesystem match wins over rewrites).

## Environment variables (Production + Preview)

Set these in Vercel → Settings → Environment Variables. They are the public
`EXPO_PUBLIC_*` values (the anon key is publishable; **never** add the
service_role key):

```
EXPO_PUBLIC_SUPABASE_URL        = https://gfmonmctebklltywhhzn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY   = <anon key from Supabase → Settings → API>
```

## Notes

- **Vercel Hobby** enforces that the deployed commit's author email is on your
  personal Vercel account. This repo commits as `notdani404` (see
  `docs/dev-setup.md`), so git-push deploys pass.
- If the build ever can't resolve `@hauliday/*` workspace packages, set the
  Install Command to `cd ../.. && pnpm install --frozen-lockfile`.
- Local build check: `cd apps/mobile && pnpm build:web` → outputs `dist/`.
