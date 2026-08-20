# LiveSpaces

Public directory of live X Spaces.

Phase 1 skeleton is on `main`. The directory chrome renders; data routes respond `501` until Phase 3.

Product definition: [`CONCEPT.md`](./CONCEPT.md). MVP tech spec: [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md). Execution contract: [`PLAN.md`](./PLAN.md). Agent notes: [`AGENTS.md`](./AGENTS.md).

## What the MVP directory will show

- How many Spaces are live right now
- Keyword search
- Cards with title, listeners, timing, topics (if present), and a Join button
- Filters: live only, minimum listeners, language
- Manual Refresh (30-minute global cooldown). No tweet/public-post harvest in MVP.

## Stack

- Next.js 16 App Router + React 19 + TypeScript (strict)
- Official X API v2 Spaces search (`GET /2/spaces/search`) only
- In-memory cache seam locally; Cloudflare KV in production
- Vitest, ESLint, Prettier

Official Spaces search requires a keyword. Browse mode uses vowel fan-out `a e i o u`, union by Space id. No public-post harvest.

## Repository layout

| Path | Role |
| --- | --- |
| `src/domain/` | Branded IDs, cards, filters, `Result`, errors |
| `src/lib/x-api/` | Bearer client, keyword search, payload mapping |
| `src/lib/directory/` | Merge, filter, load, join URL, timing |
| `src/lib/cache/` | `LiveDirectoryCache` + process-local singleton |
| `src/lib/refresh/` | Manual rebuild under cooldown |
| `src/app/` | Home page, `GET /api/spaces`, refresh route |
| `src/components/directory/` | Count, search, filters, cards |

## Local setup

Requires Node.js 22+.

1. Copy `.env.example` to `.env.local`.
2. Set `X_API_BEARER_TOKEN` (app-only bearer for public X API v2 reads).
3. Optionally set `CRON_SECRET` and `LIVE_DIRECTORY_POLL_INTERVAL_SECONDS` (default `45`, CONCEPT range 30–60).
4. Install and run:

```bash
npm install
npm run typecheck
npm test
npm run lint
npm run dev
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

Keep tokens in the environment. `.env*.local` stays out of git.

## Phase 3 start line

Daily slices live in `docs/plans/2026-08-20-mvp-daily-implementation.md`. Milestone A removes public-post coverage, host identity, Recently Shared, and cron surfaces before pure domain work begins.
