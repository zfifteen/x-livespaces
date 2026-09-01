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

**NEXT_SLICE: S15**

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
  - Modify `src/lib/x-api/get-official-x-api-json.ts` and test.
  - Commit: `feat(x-api): authenticated JSON client`.

- [x] **S14 — Map official Space fixture rows to cards.**
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

| Date | Slice | Notes | Commit subject |
| --- | --- | --- | --- |
| 2026-08-20 | S01 | Removed public-post coverage, URL parse, invalid-space-url; typecheck/tests/lint/build green. | refactor(mvp): remove public-post coverage |
| 2026-08-21 | S02 | Host identity removed from domain/cards/UI; DirectorySourceKind narrowed; typecheck/tests/lint/build green. | refactor(mvp): remove host identity from space cards |
| 2026-08-22 | S03 | (history) | |
| 2026-08-23 | S04 | Skeleton contracts aligned: errors, refresh result shape, merge batches, comments/README; typecheck/tests/lint/build green. | docs(mvp): align skeleton contracts with tech spec |
| 2026-08-24 | S05 | spaceIdFromString validates alphanumeric IDs after trim; rejects empty/whitespace/punctuation; preserves rawValue; typecheck/tests/lint/build green. | feat(domain): validate space identifiers |
| 2026-08-25 | S06 | directoryFiltersFromSearchParams parses defaults, trimmed q, last live, minListeners, lang; rejects invalid minListeners; typecheck/tests/lint/build green. | feat(directory): parse request filters |
| 2026-08-26 | S07 | applyDirectoryFilters: lifecycle, inclusive listeners, exact lang, case-insensitive title/topic, combined, stable order; typecheck/tests/lint/build green. | feat(directory): filter snapshot cards |
| 2026-08-27 | S08 | buildJoinUrl returns exact https://x.com/i/spaces/{id} with no query params; typecheck/tests/lint/build green. | feat(directory): build official join URLs |
| 2026-08-28 | S09 | formatSpaceTiming: relative minutes/hours, just now, scheduled starts, unavailable; typecheck/tests/lint/build green. | feat(directory): format space timing labels |
| 2026-08-29 | S10 | mergeDirectorySources: union by spaceId first-wins, live-first, listener desc, startedAt asc, stable ties; typecheck/tests/lint/build green. | feat(directory): merge and order space sources |
| 2026-08-30 | S11 | serializeDirectorySnapshot: ISO dates, null language/dates, optional coverage; round-trip tests; typecheck/tests/lint/build green. | feat(directory): serialize directory snapshots |
| 2026-08-31 | S12 | readLiveSpacesEnvironment: bearer required, cooldown default 1800, positive integer validation; typecheck/tests/lint green. | feat(config): read live spaces environment |
| 2026-08-31 | S13 | getOfficialXApiJson: injected fetch, bearer guard, 429+Retry-After, 401/403/5xx, JSON parse failure, network fail; typecheck/tests green. | feat(x-api): authenticated JSON client |
| 2026-09-01 | S14 | mapOfficialSpaceToCard: golden fixtures → LiveSpaceCard, no host; id/title/state/participant_count required; optional lang/timestamps; x-api-payload-unreadable on bad rows; typecheck/tests/lint/build green. | feat(x-api): map official spaces to cards |

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
