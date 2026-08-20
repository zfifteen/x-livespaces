# LiveSpaces — project agent notes

Canonical style: `/Users/velocityworks/IdeaProjects/code-style/AGENTS/AGENTS.md` and `typescript.AGENTS.md`.

## Current phase

Phase 1 skeleton is in the tree. Domain and library functions return `notImplementedYet`. Implement one function at a time only after an explicit Phase 3 request.

## Product contract

`CONCEPT.md` is the product source of truth. LiveSpaces is a public, searchable, real-time directory of live X Spaces.

## Architecture

- Next.js App Router owns UI and HTTP (`src/app`).
- Domain types live in `src/domain` and stay free of fetch/cache/React.
- Official X API access goes through `src/lib/x-api` only.
- Public Space-link harvest lives in `src/lib/coverage`.
- `LiveDirectoryCache` is the cache seam (in-memory first, Redis later).
- `loadLiveDirectory` is the only composition root the UI and `/api/spaces` should call.

## Secrets

Keep `X_API_BEARER_TOKEN` and `CRON_SECRET` in the environment. `.env*.local` stays out of git. `.env.example` lists names only.
