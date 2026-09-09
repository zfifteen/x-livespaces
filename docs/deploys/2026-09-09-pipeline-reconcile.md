# 2026-09-09 pipeline reconcile deploy

- **Date:** 2026-09-09
- **Trigger:** user-requested reconcile of the live deploy through the pipeline
- **Run:** `run_adcd8df875834f72a6f35e8e13ac2d8a`

## Prior state

Worker `x-livespaces` had been live since ~08:04 UTC from an untracked deploy. Repo HEAD `9393404` (`fix(deploy): KV-backed rate limiter enforced live; real KV ids in wrangler.toml`) already contained the working config, so no new code commit was needed.

## Verification

- `LIVE_DIRECTORY` and `NEXT_INC_CACHE_KV` are real, distinct KV ids.
- The removed `[[ratelimits]]` / `GET_SPACES_RATE_LIMITER` binding is intentional: tests assert it stays gone; production uses the KV fixed-window limiter.

## Deploy

Box system Node v20 was too old for wrangler 4.125 (wants 22). Installed Node v22.19.0 at `/home/box/.local/node22`, rebuilt OpenNext, then `npx wrangler deploy` succeeded.

## Result

- Version: `a225dacc-afb9-4ef3-88ee-15a809c8dd98`
- URL: https://x-livespaces.dionisio-lopez.workers.dev
- `GET /` 200
- `GET /api/spaces` 200 (78 live spaces at deploy time)
