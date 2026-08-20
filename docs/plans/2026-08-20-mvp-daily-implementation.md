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

