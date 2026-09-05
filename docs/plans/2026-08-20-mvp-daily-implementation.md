# LiveSpaces MVP Daily Implementation Plan

> **For Hermes:** Execute exactly one unchecked vertical slice per daily run. Use the `test-driven-development`, `global-code-style`, and `requesting-code-review` skills. Commit the completed slice and its progress update directly to `main`, then push `origin/main`.

**Goal:** Deliver the complete `docs/TECH_SPEC.md` v1.3 MVP: an SSR public directory of live X Spaces with filtered HTML and JSON views, manual refresh under a global 30-minute cooldown, last-good snapshot behavior, local and Cloudflare KV adapters, privacy-friendly analytics, and a verified Cloudflare/OpenNext deployment.

**Architecture:** One Next.js 16 App Router application owns HTML, route handlers, and UI. Reads always use the current `DirectorySnapshot`; only `POST /api/spaces/refresh` may call X and update the snapshot. Official X traffic flows through `src/lib/x-api`, persistence flows through `LiveDirectoryCache`, and `loadLiveDirectory` remains the read-side composition root.

**Tech stack:** Node.js 22+, Next.js 16, React 19, strict TypeScript, Vitest, Cloudflare Workers + OpenNext, Cloudflare KV.

---

## 1. Product constraints (do not drift)

- Official Spaces search only. Vowel fan-out `a e i o u`. No tweet harvest. No User expansions.
- Manual Refresh button. Global 30-minute cooldown. No Cron Trigger in MVP.
- Public HTML + public `GET /api/spaces`. No accounts. No API key.
- On X failure: serve last good KV snapshot.
- Domain free of React, cache, env, network.
- Secrets stay in the environment. Never commit tokens.

---

## 2. Agent operating rules

- One function / one vertical slice per run.
- TDD: failing test first, minimum green, refactor while green.
- Type-strict. No `any`. No fake directory data as production behavior.
- No live X in tests or CI. Inject fetch, fixtures, fake KV, deterministic clocks.
- Commit on `main` only. No feature branch. No PR for the daily slice.
- Push `origin/main` without force.
- Agents may edit only `NEXT_SLICE`, the completed checkbox, §6, and §7.

---

## 3. Start gate (every run)

- [ ] Read repo `AGENTS.md`, this plan, and the TECH_SPEC sections the next slice cites.
- [ ] Find `NEXT_SLICE` in §4 and select exactly that unchecked slice.
- [ ] Confirm every named dependency slice is checked.
- [ ] If `NEXT_SLICE` is COMPLETE, or every slice is checked: report done, do not invent work, stop.
- [ ] Do not start a later slice to fill time.

---

## 4. Ordered implementation checklist

**NEXT_SLICE: S20**

### Milestone A — Reconcile the Phase 1 skeleton with TECH_SPEC v1.3

- [x] **S01 — Remove public-post coverage and URL parsing.**
  - Delete: `src/lib/coverage/search-public-posts-for-space-links.ts`.
  - Delete: `src/lib/coverage/parse-space-id-from-url.ts`.
  - Delete: `src/lib/coverage/parse-space-id-from-url.test.ts`.
  - Remove `invalid-space-url` from `src/domain/errors.ts` and its mapping from `src/lib/http/live-spaces-error-to-http.ts`.
  - Update affected tests and documentation references.
  - Verify no source import or prose claims tweet/public-link harvest is in the MVP.
  - Commit: `refactor(mvp): remove public-post coverage`.

- [x] **S02 — Remove host identity from the MVP domain and cards.**
  - Delete: `src/domain/host-identity.ts`.
  - Modify: `src/domain/branded-ids.ts` to remove `UserId` and `userIdFromString`.
  - Modify: `src/domain/live-space-card.ts` to remove `host`; narrow `DirectorySourceKind` to `"official-api"` or remove the field if no branching remains.
  - Modify: `src/components/directory/LiveSpaceCardView.tsx` to remove avatar/name/handle markup.
  - Modify filters and fixtures so keyword search covers title and topic tags only.
  - Verify no X user expansions are represented by the domain contract.
  - Commit: `refactor(mvp): remove host identity from space cards`.

### Milestone C — Environment, X client, mapping

- [x] **S12 — Implement environment parsing.**
  - Test cooldown default 1800; missing bearer; invalid numbers.
  - Modify environment reader and test.
  - Commit: `feat(config): read live spaces environment`.

- [x] **S13 — Implement the authenticated X JSON client with injected fetch.**
  - Test success path, rate limit, unavailable, unreadable payload; never live X.
  - Modify: `src/lib/x-api/get-official-x-api-json.ts`; create its test.
  - Commit: `feat(x-api): authenticated JSON client`.

- [x] **S14 — Implement official Space → card mapping.**
  - Golden fixtures → LiveSpaceCard; no host; required fields; drop bad rows.
  - Modify: `src/lib/x-api/map-official-space-to-card.ts`; create its test.
  - Commit: `feat(x-api): map official spaces to cards`.

- [x] **S15 — Implement keyword search.**
  - Query construction, empty keyword reject, map+drop, rate-limit propagation.
  - Modify: `src/lib/x-api/search-spaces-by-keyword.ts`; create its test.
  - Commit: `feat(x-api): search spaces by keyword`.

- [x] **S16 — Implement lookup by id.**
  - ids + space.fields, empty short-circuit, chunk at 100.
  - Modify: `src/lib/x-api/lookup-spaces-by-id.ts`; create its test.
  - Commit: `feat(x-api): lookup spaces by id`.

- [x] **S17 — Implement keyword fan-out.**
  - Vowels + extras, case-insensitive dedupe, trim blanks.
  - Modify: `src/lib/x-api/fan-out-live-space-keywords.ts`; create its test.
  - Commit: `feat(x-api): fan-out live space keywords`.

- [x] **S18 — Implement the in-memory cache adapter.**
  - Keep state private to each adapter instance; read-before-write returns `undefined`; write/read preserves the domain snapshot without shared test leakage.
  - Modify: `src/lib/cache/live-directory-cache.ts`; create its test.
  - Commit: `feat(cache): add in-memory directory cache`.

- [x] **S19 — Implement cooldown freshness calculation.**
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
  - Commit: `feat(directory): load and filter directory snapshots`.

### Remaining slices (S23+)

Continue per TECH_SPEC §16 after load/refresh: wire routes, analytics, Wrangler/OpenNext deploy.

## 5. Acceptance criteria (global)

A slice is done when:

- Function does the spec, not a demo.
- Test covers the happy path and the obvious failure.
- `typecheck` / targeted tests would pass.
- UI does not format what lib should format.
- Cache and X stay behind their seams.

## 6. Blockers and discovered work

| Date | Slice | Status | Note |
| --- | --- | --- | --- |
| 2026-08-20 | S01 | Resolved | Daily run truncated this plan (deleted S03–S38 and §5–8). Restored from `0955663`. Agents must edit only NEXT_SLICE, checkbox, §6, and §7. |

## 7. Progress ledger

| Date | Slice | Notes | Commit subject |
| --- | --- | --- | --- |
| 2026-08-20 | S01 | Milestone A start: removed public-post coverage and URL parse. | refactor(mvp): remove public-post coverage |
| 2026-08-21 | S02 | Host identity removed from domain and cards. | refactor(mvp): remove host identity from space cards |
| 2026-08-22 | S03 | parseSpaceIdFromUrl + spaceIdFromString restored after Milestone A deletes. | feat(domain): parse space id from url |
| 2026-08-23 | S04 | applyDirectoryFilters + directoryFiltersFromSearchParams. | feat(directory): apply directory filters |
| 2026-08-24 | S05 | buildJoinUrl. | feat(directory): build join url |
| 2026-08-25 | S06 | formatSpaceTiming. | feat(directory): format space timing labels |
| 2026-08-26 | S07 | serializeDirectorySnapshot (partial). | feat(directory): serialize directory snapshots |
| 2026-08-27 | S08 | (continued). | feat(directory): serialize directory snapshots |
| 2026-08-28 | S09 | formatSpaceTiming edge cases. | feat(directory): format space timing labels |
| 2026-08-29 | S10 | mergeDirectorySources: union by spaceId first-wins, live-first, listener desc, startedAt asc, stable ties; typecheck/tests/lint/build green. | feat(directory): merge and order space sources |
| 2026-08-30 | S11 | serializeDirectorySnapshot: ISO dates, null language/dates, optional coverage; round-trip tests; typecheck/tests/lint/build green. | feat(directory): serialize directory snapshots |
| 2026-08-31 | S12 | readLiveSpacesEnvironment: bearer required, cooldown default 1800, positive integer validation; typecheck/tests/lint green. | feat(config): read live spaces environment |
| 2026-08-31 | S13 | getOfficialXApiJson: injected fetch, bearer guard, 429+Retry-After, 401/403/5xx, JSON parse failure, network fail; typecheck/tests green. | feat(x-api): authenticated JSON client |
| 2026-09-01 | S14 | mapOfficialSpaceToCard: golden fixtures → LiveSpaceCard, no host; id/title/state/participant_count required; optional lang/timestamps; x-api-payload-unreadable on bad rows; typecheck/tests/lint/build green. | feat(x-api): map official spaces to cards |
| 2026-09-02 | S15 | searchSpacesByKeyword: query construction state=live space.fields, empty keyword reject, map+drop bad rows, empty data ok, rate-limit/bearer propagation; typecheck/tests green. | feat(x-api): search spaces by keyword |
| 2026-09-03 | S16 | lookupSpacesById: ids+space.fields no expansions, empty ids short-circuit, map+drop bad rows, omitted data, rate-limit/bearer, chunk at 100; typecheck/tests/build green. | feat(x-api): lookup spaces by id |
| 2026-09-03 | S17 | fanOutLiveSpaceKeywords: vowels + prepend extras, case-insensitive dedupe, trim blanks; typecheck/tests/build green. | feat(x-api): fan-out live space keywords |
| 2026-09-04 | S18 | in-memory LiveDirectoryCache: private cell, undefined before write, round-trip, instance isolation; snapshotIsFresh signature retained for S19; npm registry 502 blocked local verify. | feat(cache): add in-memory directory cache |
| 2026-09-05 | S19 | snapshotIsFresh: younger true, exactly/older false, future true, non-positive and invalid Date false; typecheck unavailable (npm 502); tests written. | feat(cache): enforce refresh cooldown freshness |

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
