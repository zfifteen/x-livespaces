# Cloudflare deploy runbook (S29)

Coordinator executes this after the S29 commit is on `origin/main`. Do not invent account or KV namespace IDs. Never echo tokens. Never put secrets in argv, git, or chat.

**Worker name:** `x-livespaces`  
**Bindings:** `LIVE_DIRECTORY` (snapshot key `snapshot:v1`, join counters `metrics:joins:{day}`), `NEXT_INC_CACHE_KV` (OpenNext ISR — **never** the same namespace), `GET_SPACES_RATE_LIMITER` (60 req / 60s per IP on `GET /api/spaces`).  
**Rate limit namespace_id:** `1001` (developer-chosen integer in `wrangler.toml`, not a Cloudflare resource id).  
**Secret:** `X_API_BEARER_TOKEN` via `wrangler secret put` (stdin from `~/.config/hxls-x-bearer-token`). Missing bearer → `POST /api/spaces/refresh` returns **500**; `GET /` and `GET /api/spaces` still serve last KV.

Account has **no zones**. Do **not** create a zone rate-limit rule. Limiting is in-worker.

Staging vs prod: this file is prod Worker `x-livespaces`. Preview KV ids go in `preview_id`. Add `[env.staging]` later if needed.

Node 22 is the documented runtime (`engines.node >= 22`).

## 0. Auth (do not print)

```bash
cd /workspace/x-livespaces
git pull --ff-only origin main
export CLOUDFLARE_API_TOKEN
CLOUDFLARE_API_TOKEN=$(cat ~/.config/hxls-cloudflare-token)
# never echo CLOUDFLARE_API_TOKEN
```

## 1. Create two KV namespaces (live discovery)

```bash
npx wrangler kv namespace create LIVE_DIRECTORY
npx wrangler kv namespace create LIVE_DIRECTORY --preview
npx wrangler kv namespace create NEXT_INC_CACHE_KV
npx wrangler kv namespace create NEXT_INC_CACHE_KV --preview
```

Paste the returned ids into `wrangler.toml` replacing **only**:

- `REPLACE_WITH_LIVE_DIRECTORY_KV_NAMESPACE_ID` / `REPLACE_WITH_LIVE_DIRECTORY_KV_PREVIEW_ID`
- `REPLACE_WITH_NEXT_INC_CACHE_KV_NAMESPACE_ID` / `REPLACE_WITH_NEXT_INC_CACHE_KV_PREVIEW_ID`

Do not invent ids. Do not add `account_id`. Do not share the two namespaces.

## 2. Local verify (already green on S29 commit)

```bash
npx tsc --noEmit
npx vitest run
npx eslint .
npx next build
```

## 3. OpenNext Worker build

```bash
npx opennextjs-cloudflare build
```

Must produce `.open-next/worker.js`. Do not commit `.open-next/`.

## 4. Put X bearer (stdin, never argv)

```bash
npx wrangler secret put X_API_BEARER_TOKEN < ~/.config/hxls-x-bearer-token
```

Optional Web Analytics (omit if no token):

```bash
npx wrangler secret put CLOUDFLARE_WEB_ANALYTICS_TOKEN
```

(paste from a local file via stdin; never a real token in git). Empty/placeholder snippet stays unrendered.

## 5. Deploy

```bash
npx wrangler deploy
```

Record the `*.workers.dev` URL. The live URL must serve the app.

Equivalent: `npm run deploy:worker` (build + deploy) after KV ids are filled and the secret is put.

## 6. In-worker rate limit (already in the Worker)

GET /api/spaces is limited to 60 req / 60s per IP (CF-Connecting-IP) via a
LIVE_DIRECTORY KV fixed window. Over 60/min returns 429 + Retry-After.
KV failures fail open (log + allow) so a KV outage never 500s the site.
OPTIONS is not limited.

Why KV and not the Workers Rate Limiting binding: live-tested 2026-09-09,
the binding never denied over-limit traffic (150 sequential + 70 parallel
requests, zero 429s). Cloudflare documents it as permissive and eventually
consistent per isolate/location, so it cannot gate a hard 60/min. The
ratelimits block was removed from wrangler.toml; the KV limiter is enforced.

## 7. Post-deploy smoke

1. Cold KV: `GET /` empty board; Refresh enabled.
2. One successful `POST /api/spaces/refresh` (or UI Refresh) with bearer set.
3. Immediate second Refresh: cooldown skip (`refreshed: false`), no extra X fan-out.
4. Last-good: invalid bearer with a stored snapshot — board stays; coverage `cached-after-failure`.
5. Missing bearer: refresh **500**; `GET /api/spaces` still serves last KV.
6. Rate limit: 61st `GET /api/spaces` from one IP in a minute → 429 + Retry-After.
7. Optional: custom domain later; Web Analytics token as above.

## 8. X API facts (fan-out is not a census)

- `GET /2/spaces/search` **requires** `query`
- `state=live` or `scheduled` (MVP uses live)
- Empty result: omitted or empty `data` → `[]`
- Published cap ~300 searches / 15 min; five vowels ≪ that
- Credits: unique Space / UTC day
- Copy: “a broad sample of live Spaces”, never “every live Space”
