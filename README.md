# LiveSpaces

Public directory of a broad sample of live X Spaces — not every live Space on X.

Live: https://x-livespaces.dionisio-lopez.workers.dev

Product definition: [CONCEPT.md](./CONCEPT.md). MVP tech spec: [docs/TECH_SPEC.md](./docs/TECH_SPEC.md). Execution contract: [PLAN.md](./PLAN.md). Agent notes: [AGENTS.md](./AGENTS.md). Deploy runbook: [docs/runbook/cloudflare-deploy.md](./docs/runbook/cloudflare-deploy.md).

## What it does

LiveSpaces is a public, no-account directory. It shows a **broad sample** of rooms that are live on X right now — title, listener count, timing, Join. It does not list every live Space. There is no official “list every live Space” API; browse uses official Spaces search with vowel fan-out `a e i o u`.

The page shows:

- How many Spaces are live in this sample
- Keyword search and filters (live only, minimum listeners, language)
- Cards with title, listeners, timing, and Join (no host identity)
- Manual Refresh under a global 30-minute cooldown

Official Spaces search only. No tweet harvest. No User expansions.

## How refresh works

Reads (`GET /` and `GET /api/spaces`) never call X. They serve the last snapshot in cache (Cloudflare KV in production).

`POST /api/spaces/refresh` is the only writer. It fans out official live search, merges rooms, and stores `snapshot:v1`. If the snapshot is still inside the cooldown window, the POST skips X (`refreshed: false`). If X fails and a prior snapshot exists, the last-good board stays (`coverage: cached-after-failure`). Missing bearer → refresh 500; reads still serve last KV.

GET `/api/spaces` is limited to 60 requests per minute per IP (in-worker KV window). Over the limit: 429 + Retry-After.

## Copy constraint

UX must never imply a census. Keep “a broad sample of live Spaces”, never “every live Space”. Empty state: “No snapshot yet. Refresh to load a broad sample of live Spaces.”

## Stack

- Next.js 16 App Router + React 19 + TypeScript (strict)
- Official X API v2 Spaces search (`GET /2/spaces/search`) only
- In-memory cache locally; Cloudflare KV in production
- OpenNext + Cloudflare Workers
- Vitest, ESLint, Prettier

## Repository layout

| Path | Role |
| --- | --- |
| `src/domain/` | Branded IDs, cards, filters, `Result`, errors |
| `src/lib/x-api/` | Bearer client, keyword search, payload mapping |
| `src/lib/directory/` | Merge, filter, load, join URL, timing |
| `src/lib/cache/` | `LiveDirectoryCache` + KV / in-memory adapters |
| `src/lib/refresh/` | Manual rebuild under cooldown |
| `src/app/` | Home page, `GET /api/spaces`, refresh route |
| `src/components/directory/` | Count, search, filters, cards |

## Local setup

Requires Node.js 22+.

1. Copy `.env.example` to `.env.local`.
2. Set `X_API_BEARER_TOKEN` (app-only bearer for public X API v2 reads).
3. Optionally set `REFRESH_COOLDOWN_SECONDS` (default `1800`).
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

Keep tokens in the environment. `.env*.local` stays out of git. Production deploy steps: [docs/runbook/cloudflare-deploy.md](./docs/runbook/cloudflare-deploy.md).
