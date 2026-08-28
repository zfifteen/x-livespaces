# LiveSpaces MVP Daily Implementation Plan

> **For Hermes:** Execute exactly one unchecked vertical slice per daily run. Use the `test-driven-development`, `global-code-style`, and `requesting-code-review` skills. Commit the completed slice and its progress update directly to `main`, then push `origin/main`.

**Goal:** Deliver the complete `docs/TECH_SPEC.md` v1.3 MVP: an SSR public directory of live X Spaces with filtered HTML and JSON views, manual refresh under a global 30-minute cooldown, last-good snapshot behavior, local and Cloudflare KV adapters, privacy-friendly analytics, and a verified Cloudflare/OpenNext deployment.

**Architecture:** One Next.js 16 App Router application owns HTML, route handlers, and UI. Reads always use the current `DirectorySnapshot`; only `POST /api/spaces/refresh` may call X and update the snapshot. Official X traffic flows through `src/lib/x-api`, persistence flows through `LiveDirectoryCache`, and `loadLiveDirectory` remains the read-side composition root.

**Tech stack:** Node.js 22+, Next.js 16, React 19, strict TypeScript 5.9, Vitest, ESLint, Prettier, OpenNext for Cloudflare Workers, Cloudflare KV, official X API v2.

---

## 1. Binding contracts and precedence

Use these sources in descending order:

1. `docs/TECH_SPEC.md` v1.3 — binding MVP product and architecture contract.
2. This plan — ordered daily slices and gates.
3. Repo `AGENTS.md` — phase and style contract.
4. `CONCEPT.md` — product vision where it agrees with the tech spec.
5. `PLAN.md` — historical phase framing only.

If these conflict, stop and name the conflict. Do not silently pick.

---

## 2. Locked MVP decisions (do not reopen without operator)

- Next.js 16 App Router + TypeScript strict. One app. No extra process.
- Host: Cloudflare Workers + OpenNext. Snapshot store: Cloudflare KV `LIVE_DIRECTORY` / `snapshot:v1`.
- Freshness: manual Refresh button. Global 30-minute cooldown. No Cron Trigger in MVP.
- Ingest: official `GET /2/spaces/search?state=live` only. Fan-out keywords `a e i o u`. Union by Space id.
- No tweet harvest. No User expansions. No host name/avatar/handle in MVP.
- Join: `https://x.com/i/spaces/{id}` in a new tab.
- Public HTML + public `GET /api/spaces`. No accounts. No API key.
- On X failure: serve last good KV snapshot.
- Secrets stay in the environment. Never commit tokens.
- Analytics store Space ID and UTC day only; LiveSpaces does not build a first-party identity graph.

## 3. Daily run gates

### Start gate

- [ ] Read repo `AGENTS.md`, this plan, and the TECH_SPEC sections the next slice cites.
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

---

## 4. Ordered implementation checklist

**NEXT_SLICE: S10**

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

- [x] **S03 — Remove Recently Shared and cron refresh surfaces.**
  - Delete: `src/components/directory/RecentlySharedSpaces.tsx`.
  - Modify: `src/components/directory/DirectoryPageShell.tsx`.
  - Modify: `src/domain/directory-snapshot.ts` and serializer contracts to remove `recentlySharedCards`.
  - Modify: `.env.example` to remove `CRON_SECRET` and polling variables; add `REFRESH_COOLDOWN_SECONDS=1800`.
  - Verify `/api/internal/refresh`, cron, polling, and Recently Shared have no code references.
  - Commit: `refactor(mvp): remove cron and recently shared surfaces`.

- [x] **S04 — Align remaining skeleton contracts with the approved architecture.**
  - Revise intended-logic comments in cache, refresh, load, X search, mapping, merge, README, and AGENTS.
  - Set `DEFAULT_LIVE_DIRECTORY_KEYWORDS` to exactly `a`, `e`, `i`, `o`, `u`.
  - Change mapping input to Space JSON only; remove included users/topics parameters.
  - Add optional snapshot `coverage: "official-search" | "cached-after-failure"`.
  - Align refresh result shape and merge batch comments with the tech spec.
  - Commit: `docs(mvp): align skeleton contracts with tech spec`.

### Milestone B — Domain and pure directory functions

- [x] **S05 — Implement `spaceIdFromString`.**
  - Test: trims valid alphanumeric IDs; rejects empty, whitespace-only, punctuation, and malformed values; preserves original input in errors.
  - Modify: `src/domain/branded-ids.ts`; create `src/domain/branded-ids.test.ts`.
  - Use the narrowest validation compatible with observed official IDs and the spec.
  - Commit: `feat(domain): validate space identifiers`.

- [x] **S06 — Implement `directoryFiltersFromSearchParams`.**
  - Test defaults, trimmed `q`, last `live` value wins, `live=0`, non-negative integer listeners, missing/empty language, valid short language codes, and invalid values.
  - Modify: `src/domain/directory-filters.ts`; create `src/domain/directory-filters.test.ts`.
  - Commit: `feat(directory): parse request filters`.

- [x] **S07 — Implement `applyDirectoryFilters`.**
  - Test lifecycle, inclusive listener threshold, exact normalized language, case-insensitive title/topic search, combined filters, and stable input order.
  - Replace Phase 1 placeholder assertions with behavioral tests.
  - Modify: `src/lib/directory/apply-directory-filters.ts` and its test.
  - Commit: `feat(directory): filter snapshot cards`.

- [x] **S08 — Implement Join URL creation.**
  - Test exact absolute URL and absence of extra query parameters.
  - Modify: `src/lib/directory/build-join-url.ts`; create its test.
  - Commit: `feat(directory): build official join URLs`.

- [x] **S09 — Implement deterministic timing labels.**
  - Test relative labels against fixed clocks; empty and missing startedAt.
  - Modify: `src/lib/directory/format-space-timing.ts`; create its test.
  - Commit: `feat(directory): format space timing labels`.

- [ ] **S10 — Implement source merge, deduplication, and ordering.**
  - Test union by spaceId, live-first sort, listener desc, startedAt asc, stable ties.
  - Modify: `src/lib/directory/merge-directory-sources.ts` and test.
  - Commit: `feat(directory): merge and order space sources`.

- [ ] **S11 — Implement snapshot serialization.**
  - Test round-trip of DirectorySnapshot; null languageCode; coverage field.
  - Modify serializer module and test.
  - Commit: `feat(directory): serialize directory snapshots`.

### Milestone C — Environment, X client, mapping

- [ ] **S12 — Implement environment parsing.**
  - Test cooldown default 1800; missing bearer; invalid numbers.
  - Modify environment reader and test.
  - Commit: `feat(config): read live spaces environment`.

- [ ] **S13 — Implement the authenticated X JSON client with injected fetch.**
  - Test success path, rate limit, unavailable, unreadable payload; never live X.
  - Modify `src/lib/x-api/get-official-x-api-json.ts` and test.
  - Commit: `feat(x-api): authenticated JSON client`.

- [ ] **S14 — Map official Space fixture rows to cards.**
  - Golden fixtures → LiveSpaceCard; no host fields.
  - Modify mapper and test.
  - Commit: `feat(x-api): map official spaces to cards`.

- [ ] **S15 — Implement one keyword search request.**
  - Test query construction, state=live, field selection.
  - Modify search helper and test.
  - Commit: `feat(x-api): search spaces by keyword`.

### Remaining slices (S16+)

Continue per TECH_SPEC §16 order after S15. Details remain in the full checklist history and TECH_SPEC.

## 5. Acceptance criteria (global)

A slice is done when:

- The function implements the intended logic, not a demo.
- Tests cover happy path and obvious failure.
- `typecheck` / targeted tests would pass.
- UI does not format what lib should format.
- Cache and X stay behind their seams.

## 6. Blockers and discovered work

| Date | Slice | Status | Note |
| --- | --- | --- | --- |
| 2026-08-20 | S01 | Resolved | Daily run truncated this plan (deleted S03–S38 and §5–8). Restored from `0955663`. Agents must edit only NEXT_SLICE, checkbox, §6, and §7. |

## 7. Progress ledger

| Date | Slice | Verification | Commit subject |
| --- | --- | --- | --- |
| 2026-08-20 | PLAN | Plan authored from TECH_SPEC v1.3 and operator decisions; implementation has not started. | Pending plan commit |
| 2026-08-20 | S01 | Coverage modules deleted; `invalid-space-url` removed. Six commits instead of one. | refactor(mvp): remove public-post coverage |
| 2026-08-20 | PLAN | Restored full plan (S03–S38 and §5–8) after S01 run truncated the file. | docs: restore truncated daily MVP plan |
| 2026-08-21 | S02 | Host identity removed; UserId gone; cards/UI/serialize/map/search comments aligned; typecheck/tests/lint/build green. | refactor(mvp): remove host identity from space cards |
| 2026-08-22 | S03 | Deleted RecentlyShared + internal/refresh; snapshot/serializer/.env without recentlyShared/cron; typecheck/tests/lint/build green. | refactor(mvp): remove cron and recently shared surfaces |
| 2026-08-23 | S04 | Skeleton contracts aligned: vowel keywords, coverage field, refresh result shape, merge batches, comments/README; typecheck/tests/lint/build green. | docs(mvp): align skeleton contracts with tech spec |
| 2026-08-24 | S05 | spaceIdFromString validates alphanumeric IDs after trim; rejects empty/whitespace/punctuation; preserves rawValue; typecheck/tests/lint/build green. | feat(domain): validate space identifiers |
| 2026-08-25 | S06 | directoryFiltersFromSearchParams parses defaults, trimmed q, last live, minListeners, lang; rejects invalid minListeners; typecheck/tests/lint/build green. | feat(directory): parse request filters |
| 2026-08-26 | S07 | applyDirectoryFilters: lifecycle, inclusive listeners, exact lang, case-insensitive title/topic, combined, stable order; typecheck/tests/lint/build green. | feat(directory): filter snapshot cards |
| 2026-08-27 | S08 | buildJoinUrl returns exact https://x.com/i/spaces/{id} with no query params; typecheck/tests/lint/build green. | feat(directory): build official join URLs |
| 2026-08-28 | S09 | formatSpaceTiming: relative minutes/hours, just now, scheduled starts, unavailable; typecheck/tests/lint/build green. | feat(directory): format space timing labels |

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
