# LiveSpaces MVP Technical Specification

**Version:** 1.3  
**Date:** 2026-08-20  
**Status:** Approved requirements; Spaces-only cards; vowel fan-out; **manual Refresh button** (no Cron Trigger)  
**Product source:** [`CONCEPT.md`](../CONCEPT.md)  
**Codebase:** Phase 1 skeleton on `main`

This document specifies the **MVP live directory** only. Phase 2 (accounts, scheduled view, topic pages, PWA) and later ideas (extension, bots, keyed developer API, monetization) get their own specs.

---

## 1. Decisions locked in interview

| # | Decision | Choice |
| --- | --- | --- |
| 1 | Spec scope | MVP directory |
| 2 | Hosting | Cloudflare (Workers + OpenNext) |
| 3 | Directory snapshot store | Cloudflare KV |
| 4 | Freshness | **Manual Refresh button** on `/`. No Cloudflare Cron Trigger. Global cooldown **30 minutes** between X fetches. |
| 5 | X credentials | Existing app-only bearer (`X_API_BEARER_TOKEN`) |
| 6 | Join | Official `https://x.com/i/spaces/{id}` in a new tab |
| 7 | Browse coverage | Five vowel queries (`a` `e` `i` `o` `u`) on `GET /2/spaces/search?state=live`, union by Space id. No tweet harvest. No User expansions. |
| 8 | Access / SEO | Public, indexable, server-rendered |
| 9 | X API failure | Serve last good KV snapshot |
| 10 | Metrics | Privacy-friendly analytics (Cloudflare Web Analytics + Join beacon) |
| 11 | JSON API | Public `GET /api/spaces`, documented, no key |
| 12 | This file | `docs/TECH_SPEC.md` |

---

## 2. Problem and goal

X Spaces are live audio rooms. Discovery on X is personalized. LiveSpaces is a **public, searchable, real-time directory**: a live count, a filterable card grid, and one-click Join to the official Space.

**MVP goal:** A Cloudflare-hosted Next.js site that a stranger can open, see what is live, search/filter, and join — without creating an account.

---

## 3. MVP scope

### In this spec

- Live count of Spaces in the current snapshot (`lifecycleState === "live"`), independent of the visitor’s filters
- Keyword search (`q`)
- Grid of cards: title, listener count, timing line, Join (no host name/avatar)
- Filters: live only, minimum listeners, language
- Official Spaces ingest only: `GET /2/spaces/search` (`state=live`), Space fields only
- Recently shared rail deferred
- Manual Refresh button rebuilds KV (five vowel searches); 30-minute global cooldown
- Public HTML directory + public JSON
- Dark X-adjacent UI (existing chrome)
- Privacy-friendly analytics

### Deferred (later specs)

- User accounts, saved searches, favorites
- Scheduled-Spaces view as a first-class mode
- Topic URL pages (`/crypto`, `/news`)
- PWA / install prompt
- Browser extension, Discord/Telegram bots
- Community submissions
- API keys, billed quotas
- In-page audio playback
- Redis / D1 / Durable Objects
- Cloudflare Cron Trigger / scheduled Worker
- Scanning tweets / `GET /2/tweets/search/recent` for Space URLs
- Host display name, handle, and avatar (`expansions=creator_id,host_ids` → User: Read credits)

---

## 4. Users and access

| Actor | Access |
| --- | --- |
| Visitor | Anonymous. GET `/`, GET `/api/spaces`, POST `/api/spaces/refresh` (cooldown applies). |
| Search engines | Same HTML. Indexable (`index,follow`). |
| Operator | Sets Worker secrets and KV; clicks Refresh; reads Cloudflare Web Analytics. |

No X user OAuth in MVP. No cookie login.

---

## 5. Architecture

```
                    ┌──────────────────────────────┐
  browsers / bots   │  Cloudflare edge             │
  ─────────────────►│  OpenNext Worker (Next.js 16)│
                    │  GET /  GET /api/spaces      │
                    └──────────┬───────────────────┘
                               │ read
                               ▼
                    ┌──────────────────────────────┐
                    │  KV: LIVE_DIRECTORY          │
                    │  key: snapshot:v1            │
                    └──────────▲───────────────────┘
                               │ write on Refresh
                    ┌──────────┴───────────────────┐
                    │  POST /api/spaces/refresh    │
                    │  (30 min global cooldown)    │
                    │  → refreshLiveDirectory()    │
                    └──────────┬───────────────────┘
                               │ app-only bearer
                               ▼
                    ┌──────────────────────────────┐
                    │  api.x.com/2                 │
                    │  /spaces/search              │
                    │  /spaces (lookup, as needed) │
                    └──────────────────────────────┘
```

**One Next.js app** owns UI and HTTP. There is no separate Python/Express process in MVP.

**Adapter:** [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) on Cloudflare Workers (Node.js compatibility flag). Next.js 16 is supported by that adapter.

**Why KV:** the cache seam is already `LiveDirectoryCache` (read/write one `DirectorySnapshot`). A single JSON value matches that interface. Isolate memory on Workers is ephemeral; D1 and Durable Objects are reserved for later query-heavy work.

**Why a button, not cron:** The operator (or any visitor) fetches when they want a fresh board. Five vowel searches run only on that click. A **30-minute global cooldown** keeps a public button from turning into a credit stampede: extra clicks during the window serve the current KV snapshot.

---

## 6. Data model

Reuse the skeleton types in `src/domain/`.

### Card (`LiveSpaceCard`)

| Field | Meaning |
| --- | --- |
| `spaceId` | Branded official Space id |
| `title` | Space title |
| `host` | Unused in MVP. Do not request User expansions. UI omits avatar/name/handle. |
| `listenerCount` | `participant_count` |
| `topicTags` | Empty in MVP (no topic expansions) |
| `languageCode` | `lang` or `undefined` |
| `lifecycleState` | `live` \| `scheduled` \| `ended` |
| `startedAt` / `scheduledStart` | Parsed timestamps |
| `joinUrl` | `https://x.com/i/spaces/{spaceId}` |
| `sourceKind` | `official-api` \| `public-post-link` \| `merged` |

### Snapshot (`DirectorySnapshot`) stored in KV

```json
{
  "generatedAt": "2026-08-20T12:00:00.000Z",
  "liveCount": 42,
  "appliedFilters": {
    "keywordQuery": "",
    "liveOnly": true,
    "minimumListenerCount": 0,
    "languageCode": null
  },
  "visibleCards": [],
  "recentlySharedCards": []
}
```

KV holds the **unfiltered** snapshot: `appliedFilters` are defaults; `visibleCards` is the full merged set. Request filters run in `applyDirectoryFilters` after read. `liveCount` is the number of cards with `lifecycleState === "live"` at write time.

`recentlySharedCards` is empty in MVP. The “Recently shared” rail is deferred until a later spec that wants tweet harvest.

### KV contract

| Binding | `LIVE_DIRECTORY` |
| --- | --- |
| Key | `snapshot:v1` |
| Value | UTF-8 JSON of the serialized snapshot |
| Metadata (optional) | `{ "generatedAt": "<iso>" }` for cheap freshness checks |

If the value is missing, the directory is empty until someone clicks **Refresh**. Copy: “No snapshot yet. Refresh to load live Spaces.”

---

## 7. Ingest

### Official search

- Endpoint: `GET https://api.x.com/2/spaces/search`
- Required: `query` (keyword)
- `state=live`
- `space.fields`: `title,participant_count,started_at,scheduled_start,lang,state`
- **No `expansions`.** No `user.fields`. No `topic.fields`.
- Credits: **Space: Read only** ($0.005 per unique Space per UTC day)

Map each row with `mapOfficialSpaceToCard` from the Space object alone. Drop unreadable rows; keep the rest.

### Keyword fan-out (browse)

`DEFAULT_LIVE_DIRECTORY_KEYWORDS` in `src/lib/x-api/fan-out-live-space-keywords.ts`:

`a`, `e`, `i`, `o`, `u`

Five calls per refresh, union by `spaceId`. Live probe (2026-08-20) yielded ~60 unique live Spaces. Visitor `q` is an extra search only on a cold cache; otherwise filter KV.

If the visitor supplied `q`, **prepend** that keyword on a cache miss so typed search still works when KV is cold. Steady-state search filters the KV snapshot first (see §8).

### Tweet harvest — out of MVP

No `GET /2/tweets/search/recent`. The Worker does not pull posts and does not scan tweet text for Space URLs.

Browse uses the **Spaces search endpoint only**. That endpoint searches Space titles (and related Space metadata) with a required `query`, plus `state=live`. It returns up to 100 Spaces per call. There is no official “list every live Space” call with an empty query.

`query` is a keyword like `crypto` or `news`, not a path scrape of `/i/spaces`. A visitor typing in the search box becomes that `query`.

### Merge

`mergeDirectorySources` in MVP unions the vowel fan-out results by `spaceId` (the same live room can match `a` and `e`). Sort: live first, then `listenerCount` descending, then `startedAt` ascending. `sourceKind` is `official-api`.

### Refresh job (`refreshLiveDirectory`)

1. Read env (bearer)
2. If KV has a snapshot with `now - generatedAt < 1800s`, **return it and skip X** (`refreshed: false`).
3. Otherwise fan-out `GET /2/spaces/search?state=live` for `a e i o u` (plus the visitor `q` on a cold cache).
4. Merge by `spaceId`
5. Compute `liveCount`
6. **Write KV if search returned any cards, or KV is empty.** If every search fails and KV already has a snapshot, **leave KV unchanged** (decision #9)
7. Return the snapshot KV now holds (`refreshed: true` when X was called)

`POST /api/spaces/refresh` is the only writer. No Wrangler `triggers.crons`. `POST /api/internal/refresh` can stay as an alias of the same handler for now, or be removed in implementation.

`.env.example`: `REFRESH_COOLDOWN_SECONDS=1800`. `CRON_SECRET` is unused in MVP.

---

## 8. Read path

### HTML `GET /`

1. Parse `URLSearchParams` with `directoryFiltersFromSearchParams`
2. `loadLiveDirectory`: KV read → `applyDirectoryFilters` → `recentlyShared` already on snapshot
3. Serve KV as-is. Show “Updated {relative time}” and a **Refresh** button. `GET /` never calls X.
4. SSR `DirectoryPageShell` with the snapshot
5. Metadata: title `LiveSpaces`, description from CONCEPT, `robots: index,follow`, Open Graph image = neon analog hero `docs/hero-candidates/03-neon-analog-studio.jpg`

Join control:

```html
<a href="{joinUrl}" target="_blank" rel="noopener noreferrer">Join Space</a>
```

Optional `data-space-id` already exists on the card for the Join beacon.

### JSON `GET /api/spaces`

Same filters and snapshot. Body: `serializeDirectorySnapshot`. CORS: `Access-Control-Allow-Origin: *` on this route only.

No API key. Protect with a Cloudflare rate-limiting rule (start: 60 requests / minute / IP). Document the route in this spec and later in README.

Error mapping stays `liveSpacesErrorToHttp` (400 filters, 401 refresh, 429 X, 501 stub, 502 X, 500 missing bearer). **After Phase 3**, a successful KV hit is 200 even if the last refresh had a degraded source; include:

```json
{
  "generatedAt": "...",
  "liveCount": 42,
  "stale": false,
  "coverage": "official-search" | "cached-after-failure"
}
```

Add `stale` / `coverage` to the serializer in implementation (extend `DirectorySnapshot` with optional `coverage`).

### Cache freshness for `loadLiveDirectory`

`snapshotIsFresh`: `now - generatedAt < 1800s` gates **Refresh**, not reads. Reads always prefer KV if present. Only a Refresh click after the cooldown (or a missing snapshot) calls X.

---

## 9. X API client

`getOfficialXApiJson`:

- Origin `https://api.x.com`
- Header `Authorization: Bearer ${X_API_BEARER_TOKEN}`
- Map 429 → `x-api-rate-limited` + `Retry-After`
- Map 401/403/5xx → `x-api-unavailable`
- Parse JSON as `unknown`; type-guard in mappers (no `as` casts)

Secrets: Worker secret `X_API_BEARER_TOKEN` via `wrangler secret put`. Never commit tokens. `.env.local` for `npm run dev` only.

---

## 10. Cloudflare wiring

`wrangler.toml` (names indicative):

```toml
name = "x-livespaces"
compatibility_date = "2026-08-20"
compatibility_flags = ["nodejs_compat"]

[[kv_namespaces]]
binding = "LIVE_DIRECTORY"
id = "<production kv id>"
```

Implement `createKvLiveDirectoryCache(namespace)` that satisfies `LiveDirectoryCache`. `getSharedLiveDirectoryCache()` returns the KV adapter in Workers and the in-memory adapter in local `next dev` (so laptop work stays possible without Wrangler).

OpenNext incremental cache may also bind a KV namespace. **Use a separate namespace** from `LIVE_DIRECTORY` so Next ISR cache and the directory snapshot cannot clobber each other.

---

## 11. UI contract (MVP)

Existing components in `src/components/directory/` stay the chrome.

| Element | Behavior |
| --- | --- |
| Live count | `snapshot.liveCount`; `"—"` only when snapshot is missing |
| Refresh | Button in the hero. POST `/api/spaces/refresh`. Disabled while the request is in flight and while cooldown is active. Label: “Refresh” or “Refreshed N min ago”. |
| Search GET form | Preserves `live`, `minListeners`, `lang` |
| Filter GET form | Hidden `live=0` + checkbox `live=1`; last `live` param wins |
| Timing | `formatSpaceTiming(card, now)` → “Started N minutes ago” |
| Host row | Hidden. No avatar, name, or handle. |
| Empty grid | Current empty copy while snapshot has zero visible cards |
| Recently shared | Hidden in MVP |

Responsive CSS already in `globals.css` is enough for MVP. No PWA.

Dark theme only.

---

## 12. Analytics

- **Cloudflare Web Analytics** on the zone (privacy-friendly page views, referrers, countries). No client fingerprinting SDK.
- **Join beacon:** `navigator.sendBeacon("/api/analytics/join", JSON.stringify({ spaceId }))` on Join click. Server increments a KV counter `metrics:joins:{yyyy-mm-dd}` or writes to Cloudflare Analytics Engine. Store **Space id and day only** — no user id, no IP in our logs beyond what Cloudflare already collects.
- Time on site and return visits come from Web Analytics; we do not build a first-party identity graph.

---

## 13. SEO

- App Router server render of `/` with current snapshot (or empty board)
- Unique `<title>` / description
- Semantic headings already in the shell (`h1` LiveSpaces, card `h2` titles)
- Absolute Join URLs (good for crawlers that do not click)
- `sitemap.xml` later if topic pages exist; MVP can omit
- Hero OG image: neon analog banner

---

## 14. Security and ToS

- App-only public reads; Developer Policy for X API
- Refresh route: public POST with **global 30-minute cooldown** (KV `generatedAt`)
- Public JSON: edge rate limit
- No bulk scrape of private data
- `rel="noopener noreferrer"` on Join
- Secrets only in Wrangler / `.env.local`

---

## 15. Testing

| Layer | What |
| --- | --- |
| Unit | `parseSpaceIdFromUrl`, `applyDirectoryFilters`, `mergeDirectorySources`, `directoryFiltersFromSearchParams`, `liveSpacesErrorToHttp`, `serializeDirectorySnapshot`, `formatSpaceTiming`, `spaceIdFromString` |
| Client mapping | Golden fixtures of official Spaces JSON → `LiveSpaceCard` |
| Cache | Fake KV in Vitest (in-memory map implementing the binding) |
| HTTP | Route tests: 200 snapshot, 400 bad filters, 401 refresh, 501 until implemented |
| Manual | `npm run dev` with bearer; Wrangler local + KV |

No live X calls in CI. Fixtures only.

---

## 16. Implementation order (Phase 3+)

Implement one function at a time with a test and a commit (repo `AGENTS.md`).

1. `parseSpaceIdFromUrl` + `spaceIdFromString`
2. `applyDirectoryFilters` + `directoryFiltersFromSearchParams`
3. `buildJoinUrl` + `formatSpaceTiming`
4. `readLiveSpacesEnvironment` (poll default **1800**)
5. `getOfficialXApiJson` (tested with a fake `fetch`)
6. `mapOfficialSpaceToCard`
7. `searchSpacesByKeyword` / `lookupSpacesById`
8. `mergeDirectorySources` + `fanOutLiveSpaceKeywords`
9. KV adapter + `refreshLiveDirectory` + `loadLiveDirectory`
10. Wire `GET /`, `GET /api/spaces`, `POST /api/spaces/refresh`, Refresh button
11. Join beacon + Web Analytics
12. Wrangler / OpenNext deploy

---

## 17. Risks

| Risk | Handling |
| --- | --- |
| Spaces search is keyword-gated | Fan-out vowels `a e i o u` + visitor `q`. Coverage is rooms those queries return, not a census. |
| Rate limits | At most five searches per cooldown window vs 300/15 min on Spaces search; last-good KV |
| KV eventual consistency | Single key, one writer (Refresh); readers tolerate ~seconds of lag |
| Public Refresh stampede | Global 30-minute cooldown; clicks inside the window do not call X |
| OpenNext / Next 16 adapter bugs | Pin adapter; `nodejs_compat`; keep `next dev` as the local loop |
| Bearer missing in prod | 500 `missing-bearer-token` on refresh; visitors still see last KV |
| Public JSON scrapers | Edge rate limit; add keys in a later spec if needed |
| Coverage gaps | Board shows rooms whose titles match the fan-out (or the visitor’s `q`). Live count is “live in this snapshot,” not a platform-wide census. |

---

## 18. Success metrics (MVP)

From CONCEPT, via Web Analytics + Join beacon:

- Unique visitors
- Join beacons (Spaces left through LiveSpaces)
- Average time on site
- Return visits
- (Qualitative) Spaces in the grid that a personalized X tab would hide — sampled manually

---

## 19. Local and deploy commands

```bash
cp .env.example .env.local   # X_API_BEARER_TOKEN
npm install
npm run typecheck && npm test && npm run lint
npm run dev                  # in-memory cache; Refresh button writes that cache

# production-shaped local
npx wrangler kv namespace create LIVE_DIRECTORY
npx wrangler secret put X_API_BEARER_TOKEN
npx opennextjs-cloudflare build && npx wrangler deploy
```

Exact OpenNext CLI flags follow the adapter docs at implement time: [OpenNext Cloudflare](https://opennext.js.org/cloudflare) (retrieved 2026-08-20).

---

## 20. References

- [`CONCEPT.md`](../CONCEPT.md) — product, 20 July 2026
- [`PLAN.md`](../PLAN.md) — Phase 1 scaffold contract
- [`AGENTS.md`](../AGENTS.md) — phased implementation
- Skeleton: `src/domain/*`, `src/lib/**`, `src/app/**`, `src/components/directory/*`
- [X API Spaces](https://docs.x.com/x-api/spaces/introduction) — retrieved 2026-08-20
- [OpenNext on Cloudflare](https://opennext.js.org/cloudflare) — retrieved 2026-08-20
- [Cloudflare Next.js Workers guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) — retrieved 2026-08-20
- [Cloudflare Workers / OpenNext](https://opennext.js.org/cloudflare) — retrieved 2026-08-20

---

## 21. Open items for a later pass

These are **out of the MVP spec** and wait for an explicit ask:

- Production hostname / custom domain
- Cloudflare account / zone details
- Exact X API product name (Free / Basic / Pro) — rate-limit numbers once you confirm the dashboard tier
- Keyword list edits without a deploy
- Topic pages and OG per Space
- Tweet harvest / “Recently shared” rail
- Cron Trigger / automatic polling
- Cooldown shorter than 30 minutes
