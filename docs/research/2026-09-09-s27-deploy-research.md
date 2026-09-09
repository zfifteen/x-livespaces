# x-livespaces — S27 deploy research note

**Author:** MHF Researcher (for Hazard)  
**Date:** 2026-09-09  
**Scope:** OpenNext × Next.js 16, KV snapshot patterns, `GET /2/spaces/search`  
**Labels:** **Measured** = primary docs / lockfile / repo probe. **Hypothesis** = inference not re-verified against live Console today.

---

## 1. OpenNext support for Next.js 16

**Measured**

- Official OpenNext Cloudflare docs: *“All minor and patch versions of Next.js 16 … are supported.”* Source: https://opennext.js.org/cloudflare (fetched 2026-09-09).
- App Router, Route Handlers, SSR, ISR, Middleware listed supported. Edge runtime (`export const runtime = "edge"`) is **not** the path — use Node.js runtime on Workers. Source: same + get-started guide.
- npm `@opennextjs/cloudflare@1.20.6` (latest as of this note) peerDependencies:
  - `next`: `>=15.5.24 <16 || >=16.3.3`
  - `wrangler`: `^4.125.0`
  Source: https://registry.npmjs.org/@opennextjs/cloudflare/latest
- Release notes for 1.20.3+: Turbopack wasm patch for Next **16.3**; Node middleware/`proxy.ts` support is **experimental** and needs `nodejs_compat`. Sources: GitHub releases / newreleases.io for `@opennextjs/cloudflare@1.20.3`.
- This repo: `package.json` has `next: ^16.3.1`; **lockfile pins `next@16.3.1`**. That is **below** the peer floor `>=16.3.3`.

**Action for S27 (Measured gap)**

1. Bump Next (and `eslint-config-next`) to **≥16.3.3** (prefer latest 16.3.x) before/with OpenNext install.
2. `npm i @opennextjs/cloudflare@latest` + `wrangler@^4.125.0`.
3. Prefer `npx @opennextjs/cloudflare migrate` or follow https://opennext.js.org/cloudflare/get-started: `nodejs_compat`, `main: .open-next/worker.js`, assets binding, `opennextjs-cloudflare build && deploy`.
4. Keep `next dev` for day-to-day; use `preview` for Workers runtime. Separate OpenNext incremental-cache binding from `LIVE_DIRECTORY` (TECH_SPEC already says this).

**Hypothesis:** Cloudflare Workers guide table still marks “Node.js in Middleware” as not-yet on one page while OpenNext 1.20.3 claims experimental `proxy.ts` — if MVP has no `middleware.ts`/`proxy.ts`, ignore; if you add one, pin adapter ≥1.20.3 and treat as experimental.

---

## 2. KV snapshot patterns (fits TECH_SPEC)

**Measured (Cloudflare KV)**

| Limit | Value | Source |
| --- | --- | --- |
| Value size | **25 MiB** | https://developers.cloudflare.com/kv/platform/limits/ |
| Key size | 512 bytes | same |
| Metadata | 1024 bytes JSON | same |
| Same-key writes | **1/sec** (429 if faster) | https://developers.cloudflare.com/kv/api/write-key-value-pairs/ |
| Visibility | Eventually consistent; up to ~60s elsewhere | same write guidance |

**Measured (repo contract — keep)**

- Binding `LIVE_DIRECTORY`, key `snapshot:v1`, UTF-8 JSON of unfiltered `DirectorySnapshot`.
- Optional metadata `{ "generatedAt": "<iso>" }` for cheap freshness without deserializing body.
- Soft freshness via `generatedAt` + 1800s cooldown in app code — **do not** use KV `expirationTtl` for the directory snapshot (would delete last-good on idle).
- Single writer (Refresh path); readers tolerate lag. Cooldown prevents write stampede / same-key 1/sec hits.
- Last-good: on X failure with existing snapshot, leave KV unchanged (TECH_SPEC decision #9).
- Separate namespace from OpenNext ISR / incremental cache.

**Pattern recommendation (Measured + aligned to seam)**

```
Refresh → fan-out X → merge → put(snapshot:v1, json, { metadata: { generatedAt } })
GET / /api/spaces → get(snapshot:v1) → filter in process → never call X
```

Size: ~60 live cards (2026-08-20 probe in TECH_SPEC) is tiny vs 25 MiB. Version key (`snapshot:v1`) allows a future `v2` without clobbering readers mid-cutover.

**Hypothesis:** `getWithMetadata` for cooldown checks is cheaper than full JSON parse on every Refresh reject — nice-to-have in S26 adapter, not a blocker.

---

## 3. `GET /2/spaces/search` quirks + rate limits

**Measured (API shape)**

- Endpoint: `GET /2/spaces/search` (api.x.com).
- **Required:** `query` (keyword). No empty “list all live Spaces.”
- `state`: `live` | `scheduled` (docs). MVP uses `state=live`.
- Optional: `space.fields`, `expansions`.
- Example + overview: https://x-preview.mintlify.app/x-api/spaces/search (mirrors docs.x.com Spaces Search).
- Repo already encodes: `query`, `state`, `space.fields=title,participant_count,started_at,scheduled_start,lang,state`; **no expansions**; empty/`missing` `data` → empty success (`search-spaces-by-keyword.ts`).

**Measured (rate limits — published tables)**

- `GET /2/spaces/search`: **300 / 15 min** per-app **and** per-user. Source: https://x-preview.mintlify.app/x-api/fundamentals/rate-limits (Spaces → Search Spaces).
- Headers: `x-rate-limit-limit|remaining|reset`. 429 → wait until reset.
- Rate limits ≠ billing (usage credits separate). Same page.

**Measured (product / credits — TECH_SPEC + console language)**

- TECH_SPEC: Space: Read **$0.005 per unique Space per UTC day**; five vowel queries per Refresh; live probe 2026-08-20 ≈ **60 unique** live Spaces. Five searches / 30 min << 300/15 min.

**Quirks to respect (Measured in code/spec; Hypothesis where noted)**

1. **Keyword required** — vowel fan-out (`a e i o u`) is the browse strategy; not a full census of all live Spaces (**Hypothesis:** overlap incomplete; coverage is “good enough directory” not exhaustive).
2. **`data` omitted on zero hits** — treat as `[]`, not error (already implemented).
3. **App-only Bearer** is correct for public search (per-app 300/15m).
4. **max_results** — TECH_SPEC claims up to 100 per call; confirm on first live Refresh against response/`meta` (**Hypothesis** until S28 smoke).
5. Do not add User expansions in MVP (extra User: Read credits).
6. Confirm dashboard tier naming (Free/Basic/Pro) vs credit meter — TECH_SPEC open item; rate table above is endpoint-level, not tier-specific.

---

## 4. Other research the deploy slice still needs

1. **Next pin:** bump lockfile past **16.3.3** before OpenNext peer checks fail in CI.
2. **Secrets:** Worker secret / `.dev.vars` for X bearer; never commit. Refresh returns 500 `missing-bearer-token` while reads still serve last KV.
3. **Two KV namespaces:** `LIVE_DIRECTORY` vs OpenNext incremental cache (R2 or separate KV) — wire in `wrangler.jsonc` at S27.
4. **Workers size plan:** Free 3 MiB / Paid 10 MiB compressed Worker limit — watch `wrangler deploy` gzip size after OpenNext build.
5. **S28 smoke checklist:** cold Refresh (5 searches), cooldown reject, X 429 mapping, last-good on forced X failure, `getCloudflareContext` binding in Workers vs in-memory on `next dev`.
6. **Optional:** Cloudflare rate-limit rule on public JSON (TECH_SPEC: 60/min/IP) — not OpenNext-specific but deploy-adjacent.

---

## Bottom line for S27

OpenNext Cloudflare **does** support Next 16; pin **`@opennextjs/cloudflare@≥1.20.3` (latest 1.20.6)** and **Next ≥16.3.3**. TECH_SPEC KV snapshot design matches Cloudflare limits; keep soft TTL in app, not KV expiry. Spaces search is keyword + `state=live`, 300/15m, credit-metered by unique Space/day — five vowels under cooldown is safe on rate limits; completeness remains fan-out-limited by design.
