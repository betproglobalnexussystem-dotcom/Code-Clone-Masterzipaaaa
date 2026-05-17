# BetMali

A sports betting and casino platform with live odds, bet slip, slot games, and AI-powered match predictions.

## Run & Operate

- `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/bangbet run dev` — run the frontend (port 5000)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 by default)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite, Tailwind CSS 4, Radix UI, Framer Motion, React Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (server), Vite (client)
- Routing: Wouter

## Where things live

- `artifacts/bangbet/` — React frontend (main app)
- `artifacts/api-server/` — Express API server
- `lib/db/` — Drizzle ORM schema and DB client
- `lib/api-spec/` — OpenAPI 3.1.0 specification
- `lib/api-zod/` — Auto-generated Zod schemas
- `lib/api-client-react/` — Auto-generated React Query hooks
- `artifacts/bangbet/src/context/AuthContext.tsx` — Custom auth (localStorage-based)
- `artifacts/bangbet/src/lib/api.ts` — Sports data API client (topbet.ug)
- `artifacts/bangbet/src/components/MatchAI.tsx` — AI predictions via Pollinations AI

## Architecture decisions

- Auth is entirely client-side using localStorage (no server-side session management)
- Sports data is fetched directly from topbet.ug public REST API
- AI match analysis uses the free Pollinations AI API (no key required)
- Frontend runs on port 5000 and is served directly by Vite in development
- The API server is separate and mounts all routes under `/api`

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

- The vite config requires `PORT` and `BASE_PATH` environment variables at startup
- The workflow sets these: `PORT=5000 BASE_PATH=/`
- Auth data persists in `localStorage` under keys `betmali_auth` and `betmali_accounts`
- Sports API calls go to topbet.ug — if that API changes, update `artifacts/bangbet/src/lib/api.ts`
