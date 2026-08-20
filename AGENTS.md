# LiveSpaces — project agent notes

Canonical style: `/Users/velocityworks/IdeaProjects/code-style/AGENTS/AGENTS.md` and `typescript.AGENTS.md`.

## Current phase

Phase 1 skeleton is in the tree. Phase 3 proceeds through the daily vertical slices in `docs/plans/2026-08-20-mvp-daily-implementation.md`. Each run completes exactly the plan's `NEXT_SLICE`, updates the checklist and progress ledger, commits on `main`, pushes `origin/main`, and stops.

## Product contract

`docs/TECH_SPEC.md` v1.3 is the binding MVP contract. `CONCEPT.md` supplies the broader product vision where it agrees with that spec. The MVP uses official Spaces search, vowel fan-out, manual Refresh with a 30-minute cooldown, local memory plus Cloudflare KV, and no host expansion, tweet harvest, Recently Shared rail, or cron.

## Architecture

- Next.js App Router owns UI and HTTP (`src/app`).
- Domain types live in `src/domain` and stay free of fetch/cache/React.
- Official X API access goes through `src/lib/x-api` only.
- `LiveDirectoryCache` is the cache seam (in-memory locally, Cloudflare KV in production).
- `loadLiveDirectory` is the only composition root the UI and `/api/spaces` should call.
- `POST /api/spaces/refresh` is the only X-calling snapshot writer.

## Secrets

Keep `X_API_BEARER_TOKEN` in the environment and Wrangler secret storage. `.env*.local` stays out of git. `.env.example` lists names only.
