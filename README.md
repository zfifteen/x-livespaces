# LiveSpaces

![LiveSpaces](docs/hero-candidates/03-neon-analog-studio.jpg)

**The public directory for every live conversation on X.**

Open it and you see what is happening *right now*: a live count, a searchable grid, and one-click Join. Title, host, listeners, topics, how long it has been running. Filter by keyword, language, and audience size. Dark, fast, and built like a stream directory — Twitch for audio, pointed at X Spaces.

X already has the rooms. LiveSpaces is how people find them.

Hosts get a stage that actually surfaces. Niche rooms in crypto, news, tech, music, and languages stop depending on a lucky post. Journalists, researchers, and community managers get a real-time map of the conversation. Power users get the full board. Casual listeners get something interesting to drop into in ten seconds.

Coverage is hybrid on purpose: official X API for live search, plus public Space links from posts, refreshed every 30–60 seconds. That is how a small room still shows up next to the big one.

**If it is live on X, LiveSpaces puts it on a card you can join.**

This is the go-to destination for discovering and joining live conversations on X. Ship the directory; own discovery.

---

## Status

Phase 1 skeleton. Types, module boundaries, and intended control flow are in place. Feature functions return `notImplementedYet`. The directory chrome renders; data routes respond `501` until Phase 3.

Product definition: [`CONCEPT.md`](./CONCEPT.md). MVP tech spec: [`docs/TECH_SPEC.md`](./docs/TECH_SPEC.md). Execution contract: [`PLAN.md`](./PLAN.md). Agent notes: [`AGENTS.md`](./AGENTS.md).

## What the MVP directory will show

- How many Spaces are live right now
- Keyword search
- Cards with title, host, listeners, topics, duration, and a Join button
- Filters: live only, minimum listeners, language
- Recently shared Spaces harvested from public posts

## Stack

- Next.js 16 App Router + React 19 + TypeScript (strict)
- Official X API v2 Spaces search (`GET /2/spaces/search`) and lookup
- Supplementary public-post Space-link monitoring
- In-memory cache seam (Redis-shaped interface)
- Vitest, ESLint, Prettier

Official Spaces search requires a keyword. Browse mode uses a short keyword fan-out plus public-link harvest, merged by `SpaceId`.

## Repository layout

| Path | Role |
| --- | --- |
| `src/domain/` | Branded IDs, cards, filters, `Result`, errors |
| `src/lib/x-api/` | Bearer client, keyword search, lookup, payload mapping |
| `src/lib/coverage/` | Parse `/i/spaces/` URLs; harvest ids from public posts |
| `src/lib/directory/` | Merge, filter, load, join URL, timing |
| `src/lib/cache/` | `LiveDirectoryCache` + process-local singleton |
| `src/lib/refresh/` | 30–60s directory rebuild |
| `src/app/` | Home page, `GET /api/spaces`, `POST /api/internal/refresh` |
| `src/components/directory/` | Count, search, filters, cards, recently shared |

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

Implement one function at a time, with a test and a commit:

1. `parseSpaceIdFromUrl` (pure, no network)
2. `applyDirectoryFilters`
3. `readLiveSpacesEnvironment` / `getOfficialXApiJson`
