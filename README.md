# LiveSpaces

A public directory for live X Spaces: search, filter, and join from one dark, card-based board.

This repository is a **Phase 1 skeleton**. Types, module boundaries, and intended control flow are in place. Feature logic returns `notImplementedYet` until Phase 3.

Product definition: [`CONCEPT.md`](./CONCEPT.md). Execution contract: [`PLAN.md`](./PLAN.md).

## What the MVP directory will show

- How many Spaces are live right now
- Keyword search
- Cards with title, host, listeners, topics, duration, and a Join button
- Filters: live only, minimum listeners, language
- Recently shared Spaces harvested from public posts

## Stack

- Next.js 16 App Router + TypeScript (strict)
- Official X API v2 Spaces search and lookup
- Supplementary public-post Space-link monitoring
- In-memory cache seam (Redis-shaped interface)

## Local setup

1. Copy `.env.example` to `.env.local` and set `X_API_BEARER_TOKEN`.
2. `npm install`
3. `npm run typecheck`
4. `npm test`
5. `npm run dev` — the chrome renders; data routes respond `501` until Phase 3.

## Phase 3 start line

Implement `parseSpaceIdFromUrl` first (pure, no network), then `applyDirectoryFilters`, then the official API client.
