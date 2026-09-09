# Cloudflare deploy runbook (S27 config; S29 applies live)

**Do not** `wrangler login`, `wrangler deploy`, or `wrangler secret put` until Fate/Howard go/no-go on S29.

Staging vs prod: use Wrangler `[env.staging]` later if needed; this file is the prod Worker `x-livespaces`. Preview KV ids go in `preview_id`. Keep `LIVE_DIRECTORY` and `NEXT_INC_CACHE_KV` as **two namespaces**. Never share. Never invent account or namespace IDs.

## 1. Bump and local verify (already in repo)

- `next` 16.3.3, `@opennextjs/cloudflare@1.20.6`, `wrangler` 4.125.0
- `npm run typecheck && npm test && npm run lint && npm run build`
- **Measured 2026-09-09:** `npx opennextjs-cloudflare build` succeeded on this box (produced `.open-next/worker.js`). Box Node was 20.19.2 despite `engines.node >= 22` / wrangler peer; treat Node 22 as the documented runtime. Do not commit `.open-next/`.

## 2. Create KV namespaces (operator, S29)

```bash
npx wrangler kv namespace create LIVE_DIRECTORY
npx wrangler kv namespace create LIVE_DIRECTORY --preview
npx wrangler kv namespace create NEXT_INC_CACHE_KV
npx wrangler kv namespace create NEXT_INC_CACHE_KV --preview
```

Paste the returned ids into `wrangler.toml` replacing:

- `REPLACE_WITH_LIVE_DIRECTORY_KV_NAMESPACE_ID` / `REPLACE_WITH_LIVE_DIRECTORY_KV_PREVIEW_ID`
- `REPLACE_WITH_NEXT_INC_CACHE_KV_NAMESPACE_ID` / `REPLACE_WITH_NEXT_INC_CACHE_KV_PREVIEW_ID`

## 3. Secrets (operator, S29)

```bash
npx wrangler secret put X_API_BEARER_TOKEN
# optional Web Analytics is a dashboard token, not wrangler.toml
```

Missing bearer: refresh returns 500; reads still serve last KV snapshot.

## 4. Build and deploy (operator, S29)

```bash
npx opennextjs-cloudflare build
npx wrangler deploy
```

`package.json` scripts: `build:worker`, `preview:worker` (preview still needs filled KV ids).

## 5. Post-deploy smoke

1. Cold KV: `GET /` empty board; Refresh enabled.
2. One successful `POST /api/spaces/refresh` (or UI Refresh) with bearer set.
3. Immediate second Refresh: cooldown skip (`refreshed: false`), no extra X fan-out.
4. Last-good: break X (invalid bearer) with a stored snapshot — board stays; coverage `cached-after-failure`.
5. Optional: custom domain/routes; set `CLOUDFLARE_WEB_ANALYTICS_TOKEN` in Worker env if using the snippet.

## 6. Rate limit (operator dashboard — not wrangler.toml)

Cloudflare zone rule: **60 requests / minute / IP** on `GET /api/spaces`. Cannot be expressed as the only control in `wrangler.toml`.

## 7. X API facts (do not treat fan-out as a census)

- `GET /2/spaces/search` **requires** `query`
- `state=live` or `scheduled` (MVP uses live)
- Empty result: omitted or empty `data` → `[]`
- Published cap ~300 searches / 15 min; five vowels ≪ that
- Credits: unique Space / UTC day
- Copy: “a broad sample of live Spaces”, never “every live Space”
