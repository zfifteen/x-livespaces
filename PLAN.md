# PLAN.md — Task Execution Plan

**Task:** Scaffold the LiveSpaces Phase 1 skeleton (Next.js + TypeScript directory app) with complete signatures and intended-logic comments, and no feature implementation.

**Date:** 2026-08-20
**Agent:** Grok 4.6 (Grok CLI)
**Branch:** main

## 1. Objectives

- Turn `CONCEPT.md` v1.0 into a reviewable, type-strict project skeleton.
- Encode the MVP directory: live count, search, filters, cards, Join links, recently-shared, hybrid coverage, cache, 30–60s refresh.
- Keep every domain function as a documented stub that returns `notImplementedYet`.
- Leave UI as presentational chrome that composes named regions.
- Verify install + typecheck. Tests exist as `it.todo` contracts for Phase 3.

## 2. Background & Constraints

- Source of product truth: `CONCEPT.md` (20 July 2026).
- Coding protocol: `/Users/velocityworks/IdeaProjects/code-style/AGENTS/AGENTS.md` §11 Phase 1–2 only.
- TypeScript satellite: branded IDs, Result errors, no `any`, strict `tsconfig`.
- Official X API: `GET /2/spaces/search` requires a keyword `query`; a full live directory therefore needs keyword fan-out plus public Space-link monitoring (`filter:spaces` / `x.com/i/spaces`).
- Secrets stay in environment variables (`X_API_BEARER_TOKEN`). Never commit tokens.
- Stack for MVP: one Next.js App Router app (UI + Route Handlers). Separate Python/Express process is deferred until traffic or job isolation demands it.

## 3. Open Questions / Risks

1. **Spaces search is keyword-gated.**
   - Current understanding: there is no official “list every live Space” endpoint.
   - Resolution in skeleton: `searchSpacesByKeyword` + topic fan-out + public-link harvest, merged by `SpaceId`.
2. **In-memory cache vs Redis.**
   - CONCEPT marks Redis as optional.
   - Skeleton uses a `LiveDirectoryCache` interface with an in-memory adapter; Redis can implement the same interface later.
3. **Refresh mechanism.**
   - Skeleton exposes `refreshLiveDirectory` plus `POST /api/internal/refresh` for a cron caller. Process-local timers come after the function is implemented.

## 4. Detailed Execution Steps

| Step | Description                                                                                 | Files/Commands                           | Verification Method               | Status      |
| ---- | ------------------------------------------------------------------------------------------- | ---------------------------------------- | --------------------------------- | ----------- |
| 1    | Write this plan and project agent notes                                                     | `PLAN.md`, `AGENTS.md`, `README.md`      | Files exist and match CONCEPT MVP | IN PROGRESS |
| 2    | Tooling: Next 16, strict TS, ESLint, Prettier, Vitest, gitignore, env example               | `package.json`, `tsconfig.json`, configs | `npm install` succeeds            | PENDING     |
| 3    | Domain types, Result, errors, filters, snapshot                                             | `src/domain/*`                           | `tsc --noEmit`                    | PENDING     |
| 4    | X API client, search, lookup, mapping, public-link coverage, cache, refresh, directory load | `src/lib/**`                             | `tsc --noEmit`                    | PENDING     |
| 5    | App shell, directory components, API routes                                                 | `src/app/**`, `src/components/**`        | `tsc --noEmit`                    | PENDING     |
| 6    | `it.todo` tests for first pure units                                                        | colocated `*.test.ts`                    | `npm test` (todos pass)           | PENDING     |
| 7    | Phase 2 skeleton review + revisions                                                         | same tree                                | Review notes in this file         | PENDING     |

## 5. Deliverables

- A Next.js + TypeScript repo skeleton mapped to CONCEPT MVP.
- Documented module boundaries for API, coverage, cache, and UI.
- No live X calls, no fake directory data, no implemented search/filter logic.

## 6. Success Criteria

- Phase 1 comments describe control flow, edge cases, and failure modes.
- `npm install`, `npm run typecheck`, and `npm test` succeed.
- Phase 3 can implement one function at a time against the stubs.

---

**Approval:** Operator requested “scaffold the skeleton of this project up” on 2026-08-20 — treating that as approval of Phase 1–2 only.

**Execution Log** (agent fills during/after work)

- Phase 1 scaffold landed: Next.js 16 App Router, domain types, X API / coverage / cache / refresh seams, directory chrome, 501 API routes.
- Verification: `npm run typecheck`, `npm test` (8 passed, 6 todo), `npm run lint` (0 errors).
- Phase 2 review revisions: search form preserves filter query params; shared cache is a process singleton; `formatSpaceTiming` and `serializeDirectorySnapshot` added; cards take `timingLabel` so formatting stays out of the view.
- Phase 3 implementation is out of scope for this task. First units: `parseSpaceIdFromUrl`, then `applyDirectoryFilters`.
