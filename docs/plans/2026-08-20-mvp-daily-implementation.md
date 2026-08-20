# LiveSpaces MVP Daily Implementation Plan

> **For Hermes:** Execute exactly one unchecked vertical slice per daily run. Use the `test-driven-development`, `global-code-style`, and `requesting-code-review` skills. Commit the completed slice and its progress update directly to `main`, then push `origin/main`.

**Goal:** Deliver the complete `docs/TECH_SPEC.md` v1.3 MVP: an SSR public directory of live X Spaces with filtered HTML and JSON views, manual refresh under a global 30-minute cooldown, last-good snapshot behavior, local and Cloudflare KV adapters, privacy-friendly analytics, and a verified Cloudflare/OpenNext deployment.

**Architecture:** One Next.js 16 App Router application owns HTML, route handlers, and UI. Reads always use the current `DirectorySnapshot`; only `POST /api/spaces/refresh` may call X and update the snapshot. Official X traffic flows through `src/lib/x-api`, persistence flows through `LiveDirectoryCache`, and `loadLiveDirectory` remains the read-side composition root.

**Tech stack:** Node.js 22+, Next.js 16, React 19, strict TypeScript 5.9, Vitest, ESLint, Prettier, OpenNext for Cloudflare Workers, Cloudflare KV, official X API v2.

---

## 1. Binding contracts and precedence

Use these sources in descending order:

1. `docs/TECH_SPEC.md` v1.3 — binding MVP product and architecture contract.
2. This plan — implementation order, daily-run protocol, progress ledger, and acceptance gates.
3. `AGENTS.md` plus `/Users/velocityworks/IdeaProjects/code-style/AGENTS/AGENTS.md` and `typescript.AGENTS.md` — coding and phased-authoring rules.
4. `CONCEPT.md` — product vision where it agrees with the MVP spec.
5. `PLAN.md` — historical Phase 1 scaffold record only.

When documents conflict, preserve `TECH_SPEC.md` v1.3 behavior. The MVP has:

- official Spaces search only;
- vowel fan-out `a`, `e`, `i`, `o`, `u`;
- no tweet/public-post harvest;
- no host/user expansions or host UI;
- no Recently Shared rail;
- a public manual Refresh action;
- a global 1,800-second cooldown;
- local in-memory cache and production Cloudflare KV;
- no live X calls in automated tests;
- a public JSON endpoint with CORS;
- a Join beacon plus Cloudflare Web Analytics;
- Cloudflare/OpenNext deployment as the finish line.

## 2. Daily-agent operating procedure

Every daily run follows this checklist in order.

### Start gate

- [ ] `git status --short --branch` shows `main`, or the agent checks out `main`.
- [ ] `git pull --ff-only origin main` succeeds.
- [ ] The worktree is clean. If it is dirty, stop and report the paths; preserve operator work.
- [ ] Read `AGENTS.md`, this plan, and the exact `TECH_SPEC.md` sections cited by the next slice.
- [ ] Find `NEXT_SLICE` in §4 and select exactly that unchecked slice.
- [ ] Confirm every dependency named by that slice is checked.
- [ ] Do not start a later slice to fill spare time.

### Authoring and TDD gate

- [ ] Phase 1: add or revise signatures and rich intended-logic comments only when the slice changes a contract.
- [ ] Phase 2: review that skeleton against the spec before writing behavior.
- [ ] RED: add one focused behavior test and run the narrow test; record an expected behavioral failure.
- [ ] GREEN: implement the minimum behavior required by that test.
- [ ] Run the narrow test and the full suite.
- [ ] Repeat RED→GREEN vertically for each behavior included in the slice; never write a batch of tests ahead of all implementation.
- [ ] REFACTOR only while all tests remain green.
- [ ] Use injected `fetch`, golden JSON fixtures, fake KV, and deterministic clocks. Never call live X in Vitest or CI.

### Quality gate

Run, in order:

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

- [ ] All four commands exit 0 with no new warnings.
- [ ] Review the diff with `git diff --check` and `git diff`.
- [ ] Verify the slice acceptance criteria and the relevant global code-review checklist.
- [ ] Keep scope confined to the slice. Record newly discovered work under §6 instead of implementing it opportunistically.

### Progress, commit, and push gate

- [ ] Change this slice checkbox from `[ ]` to `[x]`.
- [ ] Move `NEXT_SLICE` to the next unchecked slice.
- [ ] Add one Progress Ledger row with date, slice, verification summary, and commit subject.
- [ ] Stage only the slice files, this plan, and directly required documentation.
- [ ] Commit once using the subject specified by the slice.
- [ ] `git push origin main` succeeds without force.
- [ ] Verify `git status --short --branch` is clean and up to date.
- [ ] Stop. The next daily run owns the next slice.
- **Do not rewrite this plan.** Change only `NEXT_SLICE`, the completed slice checkbox, §6, and §7. Never truncate or replace the file.

### Blocked-run rule

If a prerequisite, credential, provider UI, Cloudflare account decision, or live service prevents completion:

1. keep production behavior uncommitted unless the slice is independently complete;
2. add a concise entry to §6 with the exact blocker and evidence;
3. leave `NEXT_SLICE` unchanged;
4. do not fabricate live output, IDs, deployment URLs, or API responses;
5. stop with the worktree restored to a coherent state.

## 3. Global design invariants

- `src/domain` remains free of React, cache, environment, and network imports.
- `LiveSpaceCard` contains only fields used by the MVP. Host identity and public-post provenance are removed before mapping work begins.
- `DirectorySnapshot.liveCount` is computed from the unfiltered stored cards and remains unchanged by visitor filters.
- Stored snapshots are unfiltered; request-specific filtering creates a returned view without rewriting the cache.
- `GET /` and `GET /api/spaces` never call X.
- `POST /api/spaces/refresh` is the only X-calling/write path.
- A snapshot younger than 1,800 seconds suppresses all X calls.
- When every search fails and a prior snapshot exists, retain and serve that exact last-good snapshot with `coverage: "cached-after-failure"` in the returned view.
- Empty cache plus no usable X cards may store an empty snapshot so the app has a defined initial state.
- X JSON enters the application as `unknown` and is validated without unchecked casts.
- No test logs or application logs contain `X_API_BEARER_TOKEN`.
- Join links use `target="_blank"` and `rel="noopener noreferrer"`.
- Analytics store Space ID and UTC day only; LiveSpaces does not build a first-party identity graph.

## 4. Ordered implementation checklist

**NEXT_SLICE: S02**

### Milestone A — Reconcile the Phase 1 skeleton with TECH_SPEC v1.3

- [x] **S01 — Remove public-post coverage and URL parsing.**
  - Delete: `src/lib/coverage/search-public-posts-for-space-links.ts`.
  - Delete: `src/lib/coverage/parse-space-id-from-url.ts`.
  - Delete: `src/lib/coverage/parse-space-id-from-url.test.ts`.
  - Remove `invalid-space-url` from `src/domain/errors.ts` and its mapping from `src/lib/http/live-spaces-error-to-http.ts`.
  - Update affected tests and documentation references.
  - Verify no source import or prose claims tweet/public-link harvest is in the MVP.
  - Commit: `refactor(mvp): remove public-post coverage`.

- [ ] **S02 — Remove host identity from the MVP domain and cards.**
  - Delete: `src/domain/host-identity.ts`.
  - Modify: `src/domain/branded-ids.ts` to remove `UserId` and `userIdFromString`.
  - Modify: `src/domain/live-space-card.ts` to remove `host`; narrow `DirectorySourceKind` to `"official-api"` or remove the field if no branching remains.
  - Modify: `src/components/directory/LiveSpaceCardView.tsx` to remove avatar/name/handle markup.
  - Modify filters and fixtures so keyword search covers title and topic tags only.
  - Verify no X user expansions are represented by the domain contract.
  - Commit: `refactor(mvp): remove host identity from space cards`.

- [ ] **S03 — Remove Recently Shared and cron refresh surfaces.**
  - Delete: `src/components/directory/RecentlySharedSpaces.tsx`.
  - Delete: `src/app/api/internal/refresh/route.ts`.
  - Modify: `src/components/directory/DirectoryPageShell.tsx`.
  - Modify: `src/domain/directory-snapshot.ts` and serializer contracts to remove `recentlySharedCards`.
  - Modify: `.env.example` to remove `CRON_SECRET` and polling variables; add `REFRESH_COOLDOWN_SECONDS=1800`.
  - Verify `/api/internal/refresh`, cron, polling, and Recently Shared have no code references.
  - Commit: `refactor(mvp): remove cron and recently shared surfaces`.

- [ ] **S04 — Align remaining skeleton contracts with the approved architecture.**
  - Revise intended-logic comments in cache, refresh, load, X search, mapping, merge, README, and AGENTS.
  - Set `DEFAULT_LIVE_DIRECTORY_KEYWORDS` to exactly `a`, `e`, `i`, `o`, `u`.
  - Change mapping input to Space JSON only; remove included users/topics parameters.
  - Add optional snapshot `coverage: "official-search" | "cached-after-failure"`.
  - Define refresh result shape `{ snapshot, refreshed }` if needed by the HTTP/UI contract.
  - Keep implementations stubbed during contract alignment.
  - Commit: `docs(mvp): align skeleton contracts with tech spec`.

### Milestone B — Pure domain and presentation functions

- [ ] **S05 — Implement `spaceIdFromString`.**
  - Test: trims valid alphanumeric IDs; rejects empty, whitespace-only, punctuation, and malformed values; preserves original input in errors.
  - Modify: `src/domain/branded-ids.ts`; create `src/domain/branded-ids.test.ts`.
  - Use the narrowest validation compatible with observed official IDs and the spec.
  - Commit: `feat(domain): validate space identifiers`.

- [ ] **S06 — Implement `directoryFiltersFromSearchParams`.**
  - Test defaults, trimmed `q`, last `live` value wins, `live=0`, non-negative integer listeners, missing/empty language, valid short language codes, and invalid values.
  - Modify: `src/domain/directory-filters.ts`; create `src/domain/directory-filters.test.ts`.
  - Commit: `feat(directory): parse request filters`.

- [ ] **S07 — Implement `applyDirectoryFilters`.**
  - Test lifecycle, inclusive listener threshold, exact normalized language, case-insensitive title/topic search, combined filters, and stable input order.
  - Replace Phase 1 placeholder assertions with behavioral tests.
  - Modify: `src/lib/directory/apply-directory-filters.ts` and its test.
  - Commit: `feat(directory): filter snapshot cards`.

- [ ] **S08 — Implement Join URL creation.**
  - Test exact absolute URL and absence of extra query parameters.
  - Modify: `src/lib/directory/build-join-url.ts`; create its test.
  - Commit: `feat(directory): build official join URLs`.

- [ ] **S09 — Implement deterministic timing labels.**
  - Test minutes, hours, boundary rounding, missing start time, and defensive future timestamps using an injected `now`.
  - Modify: `src/lib/directory/format-space-timing.ts`; create its test.
  - Wire the formatter into `LiveSpaceGrid` without adding client clocks.
  - Commit: `feat(directory): format live space timing`.

- [ ] **S10 — Implement source merge, deduplication, and ordering.**
  - Adapt the API to one or more official-search result batches.
  - Test duplicate IDs, live-first ordering, listener descending order, start-time ascending tie-break, undefined dates, and stable final ties.
  - Modify: `src/lib/directory/merge-directory-sources.ts`; create its test.
  - Commit: `feat(directory): merge and rank official search results`.

- [ ] **S11 — Implement snapshot serialization.**
  - Serialize dates to ISO, optional dates/language to `null`, branded IDs to strings, and coverage/stale fields to the public contract.
  - Remove all host and Recently Shared fields.
  - Test a populated and empty snapshot without JSON round-trip ambiguity.
  - Modify: `src/lib/http/serialize-directory-snapshot.ts`; create its test.
  - Commit: `feat(api): serialize directory snapshots`.

### Milestone C — Environment, X client, fixtures, and ingest

- [ ] **S12 — Implement environment parsing.**
  - `X_API_BEARER_TOKEN` is required only by refresh-side callers; trim and reject empty.
  - Parse `REFRESH_COOLDOWN_SECONDS`, default 1800, require a positive integer, and expose a clearly named `refreshCooldownSeconds`.
  - Use explicit env objects in tests; never mutate global process env.
  - Modify: `src/lib/env/read-live-spaces-environment.ts`; create its test.
  - Commit: `feat(config): read refresh environment`.

- [ ] **S13 — Implement the authenticated X JSON client with injected fetch.**
  - Extend request input with a `fetchImplementation` defaulting to global `fetch`.
  - Test origin/path construction, GET method, bearer header, success JSON, malformed JSON, 429 plus Retry-After, 401/403, 5xx, and network rejection.
  - Assert test output never contains the bearer.
  - Modify: `src/lib/x-api/official-x-api-client.ts`; create its test.
  - Commit: `feat(x-api): add authenticated JSON client`.

- [ ] **S14 — Map official Space fixture rows to cards.**
  - Create scrubbed golden fixtures under `src/lib/x-api/fixtures/` containing success, optional fields, and malformed rows.
  - Validate `id`, `title`, `state`, `participant_count`, `lang`, `started_at`, and `scheduled_start` from `unknown` without `as` casts.
  - Build the canonical join URL; set empty topic tags and official source.
  - Test numeric/date/state validation and readable payload failures.
  - Modify: `src/lib/x-api/map-official-space-to-card.ts`; create its test and fixtures.
  - Commit: `feat(x-api): map official space payloads`.

- [ ] **S15 — Implement one keyword search request.**
  - Build `/2/spaces/search` with encoded query, `state=live`, `max_results=100`, and approved `space.fields`; include no expansions/user/topic fields.
  - Inject the JSON client for deterministic tests.
  - Map readable rows, drop malformed rows when at least one is usable, and define total-unreadable behavior.
  - Modify: `src/lib/x-api/search-spaces-by-keyword.ts`; create its test.
  - Commit: `feat(x-api): search live spaces by keyword`.

- [ ] **S16 — Remove lookup-by-ID if no approved call path needs it.**
  - Confirm `TECH_SPEC.md` implementation path never uses lookup without harvest.
  - Delete `src/lib/x-api/lookup-spaces-by-id.ts` and references.
  - Keep only behavior required by vowel/visitor-query search.
  - Commit: `refactor(x-api): remove unused space lookup`.

- [ ] **S17 — Implement vowel fan-out orchestration.**
  - Return exactly five canonical vowels by default; prepend one trimmed visitor query only for cold-cache refresh; deduplicate case-insensitively.
  - Execute searches with injected search function.
  - Preserve usable batches under partial failure and return an error when every search fails.
  - Test call order, deduplication, partial failure, and total failure.
  - Modify: `src/lib/x-api/fan-out-live-space-keywords.ts`; create its test.
  - Commit: `feat(x-api): fan out live space searches`.

### Milestone D — Local cache and read/write composition

- [ ] **S18 — Implement the in-memory cache adapter.**
  - Keep state private to each adapter instance; read-before-write returns `undefined`; write/read preserves the domain snapshot without shared test leakage.
  - Add a test-only reset only if dependency injection cannot provide isolation.
  - Modify: `src/lib/cache/live-directory-cache.ts`; create its test.
  - Commit: `feat(cache): add in-memory directory cache`.

- [ ] **S19 — Implement cooldown freshness calculation.**
  - Test younger than 1800s, exactly 1800s, older, future timestamp, non-positive max age, and invalid dates.
  - Modify `snapshotIsFresh` and its tests.
  - Commit: `feat(cache): enforce refresh cooldown freshness`.

- [ ] **S20 — Implement `refreshLiveDirectory` success and cooldown paths.**
  - Inject cache, environment reader, fan-out/search function, and clock inputs.
  - Fresh snapshot returns it with `refreshed: false` and zero X calls.
  - Missing/stale snapshot performs vowel fan-out, merges, computes unfiltered live count, writes defaults plus `coverage: "official-search"`, and returns `refreshed: true`.
  - Visitor `q` is included only on a cold cache as specified.
  - Modify: `src/lib/refresh/refresh-live-directory.ts`; create focused tests.
  - Commit: `feat(refresh): rebuild directory snapshots`.

- [ ] **S21 — Implement last-good snapshot recovery.**
  - Test total X failure with prior snapshot leaves the stored snapshot unchanged and returns a view marked `cached-after-failure`.
  - Test total failure with empty cache follows the explicitly documented empty-initial-state behavior.
  - Test partial success writes the usable result.
  - Modify refresh code/tests only.
  - Commit: `feat(refresh): preserve last good snapshot`.

- [ ] **S22 — Implement read-only `loadLiveDirectory`.**
  - Read cache once; never call refresh or X.
  - Missing snapshot returns a defined empty view with caller filters.
  - Existing snapshot applies filters to stored cards while preserving unfiltered `liveCount` and stored `generatedAt`.
  - Cache read failures propagate as domain errors.
  - Modify: `src/lib/directory/load-live-directory.ts`; create its test.
  - Commit: `feat(directory): load filtered cached snapshots`.

### Milestone E — HTTP and UI vertical slices

- [ ] **S23 — Wire public JSON `GET /api/spaces`.**
  - Parse request filters, call `loadLiveDirectory`, serialize, map errors, and set `Access-Control-Allow-Origin: *` only here.
  - Add route tests for 200 populated/empty snapshots and 400 filters; remove obsolete 501 expectations.
  - Modify: `src/app/api/spaces/route.ts` and route tests.
  - Commit: `feat(api): serve public spaces directory`.

- [ ] **S24 — Wire SSR home page and metadata.**
  - Parse App Router search params, load cached snapshot, render `DirectoryPageShell`, and provide a safe error/empty state.
  - Set title, CONCEPT description, index/follow robots, and OG image using the neon analog hero.
  - Test server-rendered headings, filter round-trip, and missing snapshot copy at the most stable available layer.
  - Modify: `src/app/page.tsx`, `src/app/layout.tsx`, relevant components/tests.
  - Commit: `feat(web): render cached live directory`.

- [ ] **S25 — Finalize cards, filters, timing, and Join semantics.**
  - Show title, listeners, timing, topics if present, and Join.
  - Use `target="_blank"`, `rel="noopener noreferrer"`, and `data-space-id`.
  - Preserve all filters across search and filter GET forms; verify last `live` param behavior.
  - Replace Phase 1 empty/timing copy with MVP copy.
  - Add focused React/component tests only if the project’s test setup can support them without unnecessary tooling; otherwise verify SSR HTML/build plus pure helpers.
  - Commit: `feat(web): finalize directory cards and filters`.

- [ ] **S26 — Add the manual Refresh route.**
  - Create `src/app/api/spaces/refresh/route.ts`.
  - Public POST invokes refresh composition, returns snapshot metadata plus `refreshed`, and maps missing bearer/X errors.
  - Cooldown clicks return 200 and `refreshed: false`; concurrent safety relies on the shared snapshot contract and is documented.
  - Test fresh, stale, missing, rate-limited, and last-good paths with injected dependencies.
  - Commit: `feat(refresh): add public refresh endpoint`.

- [ ] **S27 — Add the Refresh client control.**
  - Create a minimal client component for POST, in-flight disabled state, success/error feedback, and page refresh/revalidation after success.
  - Display “Refresh” before a snapshot and “Refreshed N min ago” during cooldown using deterministic server-provided timing where practical.
  - Keep GET rendering independent of client JavaScript.
  - Modify `DirectoryPageShell`, `LiveSpaceCount`, CSS, and add focused tests.
  - Commit: `feat(web): add manual refresh control`.

### Milestone F — Analytics and production persistence

- [ ] **S28 — Implement the privacy-preserving Join beacon.**
  - Add a small client boundary that calls `navigator.sendBeacon("/api/analytics/join", JSON.stringify({ spaceId }))` without blocking navigation.
  - Validate Space ID in `POST /api/analytics/join`; reject malformed bodies.
  - Define an injected `JoinMetricStore` that records Space ID and UTC day only.
  - Test client trigger and server validation without real network/storage.
  - Commit: `feat(analytics): record join beacons`.

- [ ] **S29 — Implement local join metrics storage and document Web Analytics.**
  - Supply a process-local metric adapter for `next dev` and tests.
  - Add README instructions for enabling Cloudflare Web Analytics at the zone, with no fingerprinting SDK.
  - Ensure no user ID, IP, user agent, or first-party cookie enters metric payloads.
  - Commit: `feat(analytics): add privacy-safe local metrics`.

- [ ] **S30 — Implement the Cloudflare KV directory adapter.**
  - Create `src/lib/cache/kv-live-directory-cache.ts` with a minimal structural KV interface to keep tests independent of Wrangler globals.
  - Key: `snapshot:v1`; serialize/deserialize dates and validate unknown stored JSON.
  - Add fake-KV tests for missing, populated, corrupt, and write/read paths.
  - Do not use the Next/OpenNext incremental-cache namespace.
  - Commit: `feat(cache): add Cloudflare KV directory adapter`.

- [ ] **S31 — Select local or Worker cache at the shared-cache boundary.**
  - Make `getSharedLiveDirectoryCache()` use bound `LIVE_DIRECTORY` in Workers and the singleton in-memory adapter in `next dev`.
  - Keep runtime detection explicit and testable; missing production binding fails clearly.
  - Test adapter selection without importing unavailable Worker globals in Node.
  - Commit: `feat(cache): select runtime directory storage`.

- [ ] **S32 — Implement Cloudflare join metric storage.**
  - Use a separate metrics binding or approved Analytics Engine adapter; never collide with `LIVE_DIRECTORY` or OpenNext incremental cache.
  - Key/counter contract: `metrics:joins:{yyyy-mm-dd}` with Space ID/day-only detail as approved by the spec.
  - Add fake binding tests and wire the production adapter.
  - Commit: `feat(analytics): persist Cloudflare join metrics`.

### Milestone G — Cloudflare/OpenNext and release gates

- [ ] **S33 — Add OpenNext and Wrangler configuration.**
  - Re-check current official OpenNext/Cloudflare docs before pinning versions or CLI flags.
  - Add required packages and scripts, `wrangler.toml`/JSON config, `nodejs_compat`, and distinct binding placeholders for directory, OpenNext cache, and metrics.
  - Never commit real namespace IDs or secrets unless the config format explicitly requires non-secret resource IDs and the operator supplied them.
  - Verify local production-shaped build.
  - Commit: `build(cloudflare): configure OpenNext worker`.

- [ ] **S34 — Add CI quality gates.**
  - Create GitHub Actions workflow for Node 22 install, typecheck, Vitest, lint, and build.
  - Use no bearer token and make all tests fixture-only.
  - Verify workflow syntax locally where possible and confirm the pushed check is green.
  - Commit: `ci: verify LiveSpaces quality gates`.

- [ ] **S35 — Complete local end-to-end acceptance without live X.**
  - Seed the in-memory/fake KV through a documented development fixture path that cannot activate in production.
  - Verify SSR count/cards/filters/Join, public JSON+CORS, cooldown, Refresh state, stale recovery, and beacon acceptance.
  - Remove or guard any temporary harness; retain reusable fixtures/tests.
  - Capture exact commands and expected observations in README.
  - Commit: `test: verify local MVP flow`.

- [ ] **S36 — Perform the operator-authorized live X smoke test.**
  - This is the only slice allowed to call live X.
  - Require `X_API_BEARER_TOKEN` from `.env.local` or approved secret store; never print it.
  - Call one controlled refresh after cooldown, verify five vowel searches via safe instrumentation, inspect resulting card count/shape, then verify a second refresh makes zero X calls.
  - Record only non-secret observations. If credentials are unavailable, leave this slice unchecked and blocked.
  - Commit documentation only if it changes durable setup/verification guidance: `docs: record live X smoke procedure`.

- [ ] **S37 — Provision Cloudflare resources and deploy.**
  - Require operator-approved Cloudflare account/zone/resource choices.
  - Create distinct KV/analytics/OpenNext resources, set `X_API_BEARER_TOKEN` with Wrangler secret tooling, and deploy the OpenNext Worker.
  - Do not place payment/account-recovery data or secrets in files/chat.
  - Capture deployment URL and resource binding names from real command output.
  - Commit config updates only when they contain safe resource identifiers: `chore(deploy): bind production Cloudflare resources`.

- [ ] **S38 — Verify production MVP and close the plan.**
  - Read back the deployed homepage, `/api/spaces`, refresh endpoint, CORS, headers, metadata, Join target/rel, cooldown behavior, last-good behavior, Join beacon response, and Cloudflare Web Analytics enablement.
  - Confirm the public JSON edge rate limit is configured at 60 requests/minute/IP or document the exact deployed alternative.
  - Run final local quality gates and confirm production remains healthy.
  - Update README status from skeleton to deployed MVP.
  - Set `NEXT_SLICE: COMPLETE`, check final acceptance below, and commit/push: `docs: mark LiveSpaces MVP complete`.

## 5. Final acceptance checklist

### Product

- [ ] Anonymous visitors receive an SSR directory or defined empty state.
- [ ] Live count reflects unfiltered live cards in the snapshot.
- [ ] Keyword, live-only, minimum-listener, and language filters compose correctly.
- [ ] Cards show approved MVP fields and open official Space URLs safely.
- [ ] Manual Refresh works and communicates cooldown/in-flight state.
- [ ] Recently Shared, host UI, tweet harvest, cron, accounts, PWA, and topic pages remain absent.

### Data and resilience

- [ ] Browse refresh uses exactly `a e i o u`, plus visitor `q` only on cold cache.
- [ ] Stored snapshot is unfiltered.
- [ ] Refresh inside 1,800 seconds performs zero X calls.
- [ ] Partial search success produces a usable snapshot.
- [ ] Total refresh failure preserves the last-good stored snapshot.
- [ ] Automated tests and CI perform zero live X calls.

### API, security, and privacy

- [ ] `GET /api/spaces` is public, filtered, serialized, and CORS-enabled.
- [ ] Refresh and X errors map to documented HTTP statuses.
- [ ] Secrets remain solely in `.env.local`/Wrangler secret storage.
- [ ] Public JSON edge rate limiting is active.
- [ ] Join analytics retain only Space ID and UTC day.
- [ ] Cloudflare Web Analytics is enabled without a fingerprinting SDK.

### Engineering and deployment

- [ ] `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build` pass.
- [ ] CI passes on `main` without secrets.
- [ ] Local `next dev` uses in-memory cache.
- [ ] Worker runtime uses dedicated Cloudflare KV via `LIVE_DIRECTORY`.
- [ ] OpenNext incremental cache and metrics use separate storage.
- [ ] Production URL is deployed and read-back verified.
- [ ] README accurately documents setup, API, refresh, deployment, and current status.

## 6. Blockers and discovered work

| Date | Slice | Status | Evidence / next action |
| --- | --- | --- | --- |
| 2026-08-20 | S01 | Resolved | Daily run truncated this plan (deleted S03–S38 and §5–8). Restored from `0955663`. Agents must edit only NEXT_SLICE, checkbox, §6, and §7. |

Out-of-scope discoveries go here and wait for a later plan: custom domain, editable keyword lists, topic pages, scheduled directory, tweet harvest, host enrichment, cron, accounts, PWA, API keys, and monetization.

## 7. Progress ledger

| Date | Slice | Verification | Commit subject |
| --- | --- | --- | --- |
| 2026-08-20 | PLAN | Plan authored from TECH_SPEC v1.3 and operator decisions; implementation has not started. | Pending plan commit |
| 2026-08-20 | S01 | Coverage modules deleted; `invalid-space-url` removed. Six commits instead of one. | refactor(mvp): remove public-post coverage |
| 2026-08-20 | PLAN | Restored full plan (S03–S38, §5–8) after S01 run truncated the file. | docs: restore truncated daily MVP plan |

## 8. Daily completion report template

Use this concise final report after push:

```text
Completed: SNN — <slice title>
Commit: <sha> <subject>
Pushed: origin/main
Verified: typecheck; tests; lint; build
Plan: SNN checked; NEXT_SLICE moved to SNN+1
Notes: <one sentence or “None”>
```

If blocked:

```text
Blocked: SNN — <slice title>
Evidence: <exact non-secret failure>
Worktree: <clean or named retained files>
Plan: NEXT_SLICE remains SNN; blocker recorded in §6
Required operator action: <single concrete action>
```
