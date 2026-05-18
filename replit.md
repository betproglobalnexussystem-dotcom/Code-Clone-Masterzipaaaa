# BetMali

A sports betting and casino platform with live odds, bet slip, slot games, and AI-powered match predictions.

## Run & Operate

- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/bangbet run dev` — run the frontend (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/bangbet run build` — production build (outputs to `artifacts/bangbet/dist/public`)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS 4, Radix UI, Framer Motion, React Query
- Auth & DB: Firebase Auth + Firestore (client SDK only — fully serverless)
- Routing: Wouter

## Where things live

- `artifacts/bangbet/` — React frontend (main app, the entire product)
- `artifacts/bangbet/src/context/AuthContext.tsx` — Auth (localStorage + Firebase Auth)
- `artifacts/bangbet/src/lib/api.ts` — Sports data API client (topbet.ug)
- `artifacts/bangbet/src/lib/marketResolver.ts` — Bet settlement market resolver (client-side)
- `artifacts/bangbet/src/lib/resultsApi.ts` — Results fetcher from topbet.ug (client-side, cached)
- `artifacts/bangbet/src/components/ClientSettlement.tsx` — In-browser bet settlement worker
- `artifacts/bangbet/src/components/MatchAI.tsx` — AI predictions via Pollinations AI
- `artifacts/bangbet/src/components/PendingPaymentRecovery.tsx` — Payment polling recovery
- `vercel.json` — Vercel deployment config (root of repo)

## Architecture decisions

- **Fully serverless** — no Express backend required. The entire app is a static Vite build.
- Auth is client-side using localStorage + Firebase Auth
- Sports data is fetched directly from topbet.ug public REST API (browser → topbet.ug)
- Bet data stored in Firebase Firestore (client SDK, no admin SDK)
- **Bet settlement** runs client-side: `ClientSettlement` component polls the logged-in user's pending bets from Firestore every 30s, checks results from topbet.ug, and settles via Firestore client writes
- Payment processing handled by external Railway service: `https://function-bun-production-b22d.up.railway.app/`
- AI match analysis uses the free Pollinations AI API (no key required)

## Vercel Deployment

- `vercel.json` at repo root configures everything
- Build command: `pnpm --filter @workspace/bangbet run build`
- Output directory: `artifacts/bangbet/dist/public`
- SPA routing: all paths rewrite to `/index.html`
- No server functions needed — everything runs in the browser

## Product

- Sports betting with live odds across football, basketball, tennis, rugby, MMA, baseball, volleyball, and e-sports
- Live betting for in-progress matches
- Casino slot games (Dragon Fortune, Viking Conquest)
- Mega Jackpot system
- AI-powered match predictions and betting analysis
- Bet slip with multi-bet support
- User wallet with deposit/withdrawal
- Referral bonus system
- Admin dashboard at `#admin`

## User preferences

- App name: BetMali
- Currency: UGX (Ugandan Shilling)

## Gotchas

- `PORT` and `BASE_PATH` default to `5000` and `/` if not set (safe for Vercel builds)
- The workflow still sets `PORT=5000 BASE_PATH=/` for Replit dev
- Auth data persists in `localStorage` under keys `betmali_auth` and `betmali_accounts`
- Sports API calls go to topbet.ug — if that API changes, update `artifacts/bangbet/src/lib/api.ts`
- Settlement only runs for the currently logged-in user's bets (client-side constraint)
