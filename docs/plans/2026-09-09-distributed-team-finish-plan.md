# x-livespaces — Distributed Team Finish Plan (FINAL)

**Date:** 2026-09-09 — finalized after full team review (all 10 agents + Hermes)
**Repo:** https://github.com/zfifteen/x-livespaces
**Coordinator:** Hazard
**Published to repo:** `docs/plans/2026-09-09-distributed-team-finish-plan.md`
**Goal:** Finish the LiveSpaces MVP — a public, searchable directory of live X Spaces
(Next.js 16 App Router + React 19 + strict TypeScript, Cloudflare Workers + OpenNext + KV).

## Current state (Hermes-verified 2026-09-09)

- Daily plan slices **S01–S22 complete** (2026-09-08, HEAD `6db6586`). **NEXT_SLICE: S23**.
- Lib is ahead of HTTP: `loadLiveDirectory` / `refreshLiveDirectory` / in-memory cache exist;
  `GET /` is still an empty shell, `GET /api/spaces` returns `501`, no `POST /api/spaces/refresh`,
  no Refresh button, no `wrangler.toml`, shared cache still in-memory only.

## Team capabilities (confirmed 2026-09-09)

| Agent | Capabilities | Status | x-livespaces assignment |
|---|---|---|---|
| Howard | Fleet lead / PA; box-side routing; `gh` as zfifteen (ADMIN/push) | Quiet, available | Co-owns workstream; backup publisher; deploy go/no-go |
| Hermes | Box agent; `hermes peer` async runs; per repo daily plan: implements slices, commits+pushes `main` | Idle | **Implementation engine** (single feed path: Hazard → peer run) |
| Hermes Bridge | Grok Bot ↔ Hermes peer bridge | Idle | Bridge health only — idle unless the peer bridge itself breaks |
| Got Bot Gateway Expert | Box RPC gateway (:1340), explorer, Pulse; repo/doc polish experience | Idle, ladder watches paused | Infra/deploy review: wrangler, OpenNext, KV, runbook (on-demand) |
| MHF Researcher | Web/API research, short Measured/Hypothesis notes | Research standing | Up-front research lane (on-demand) |
| Novel Insight Bot | Claim Stress / falsifier pressure | Standby | Falsifier lane: review comments only, no code (on-demand) |
| Prime Gap Structure | Technical review | HARD STAND-DOWN (ladder) | Pure-function code review only — no compute (on-demand) |
| Steven King | Designated writer, House Voice prose | Standby | Copy/docs lane (on-demand; needs drafts/bullets + must-keeps) |
| X.com Account Manager | Analytics / reply-DNA / gap tracking | Pack live; no posting until user says | Analytics verification + launch angle (on-demand) |
| Message Board Bot | Digests, collab coordination | Board every 4h continues | Daily status digest once execution starts |
| Bot Dispatcher | Temp-crew / ladder compute | Hard stand-down, idle | Parked (reserve for load tests after stand-down lifts) |

**Structural rules from review:**
- **Single Hermes feed path.** Hazard feeds Hermes directly via `hermes peer run`. Hermes Bridge stays
  idle unless the peer bridge itself is broken. (Fixes double-booking flagged by Howard.)
- **Credit discipline.** Waking Grok Bots burns Grok credits even outside ladder compute. Grok lanes are
  **on-demand / batched**, not always-on. Hermes does the per-slice work. (Flagged by Howard.)
- **Stand-down scope.** The hard stand-down covers PGS/ladder compute (MATCH/RATIFY, burns) — not all
  agent activity. Comment-only review (PGS, Novel Insight Bot) is allowed. (Confirmed by Howard + PGS.)

## Coordination rules

1. **Task files + idempotency keys.** Each slice gets a task file; Hermes runs
   `hermes peer run local --idempotency-key hazard-xls-SNN < task.txt`. One slice per run.
   Hazard polls each run to a terminal status before the next slice starts.
2. **Repo rules (daily plan §2) hold:** `main` only, no feature branches, no PRs, no force push.
   Agents edit only `NEXT_SLICE`, the checkbox, §6, §7 in the daily plan.
3. **Publisher:** Hermes commits + pushes `origin/main` per slice. Howard is backup publisher and
   deploy go/no-go. **Git identity:** the box worktree had no `user.name`/`user.email`; derive it from
   the most recent `main` commit author (`git log -1 --format='%an <%ae>'`) and set locally before
   the first push. Never invent an identity. (Blocker found + fixed by Hermes.)
4. **Operator-gated (Fate):** Cloudflare account auth, `wrangler secret put X_API_BEARER_TOKEN`,
   KV namespace creation, dashboard rate-limit rule, custom domain. Hermes prepares everything;
   nothing live is applied autonomously.
5. **Verification per slice** (daily plan §5): function does the spec; tests cover happy path + failure;
   `typecheck` / tests / lint / build green; UI doesn't format what lib should format; cache and X
   stay behind their seams.
6. **Blocker protocol** (daily plan §8): `Blocked: SNN — evidence — worktree state — required
   operator action`. Routed via Howard to Hazard.
7. **Assignments** go over the gateway with the `HAZARD:` prefix; hourly sweeps collect replies;
   Message Board Bot digests daily once execution starts.

## Slice chain (final)

| Slice | Work | Owner |
|---|---|---|
| S23 | Route wiring: `GET /` SSR via `loadLiveDirectory`; `GET /api/spaces` (CORS `*`, filters, `stale`/`coverage` fields); `POST /api/spaces/refresh` (30-min cooldown) | Hermes |
| S24 | Refresh button UI: hero button, disabled/in-flight states, "Refreshed N min ago" | Hermes |
| S25 | Analytics: Cloudflare Web Analytics snippet + first-party Join beacon | Hermes (+ X.com Account Manager verifies) |
| S26 | KV adapter: `createKvLiveDirectoryCache`; `getSharedLiveDirectoryCache` (KV in Workers, in-memory local) | Hermes |
| S27 | `wrangler.toml` + OpenNext + deploy config | Hermes (+ Gateway Expert reviews) |
| S28 | Refresh hardening (falsifier fixes, see below) | Hermes |
| S29 | Cloudflare deploy — **operator-gated** | Hermes prepares; Fate applies secrets/auth; Howard go/no-go |
| S30 | Post-deploy smoke, rate-limit verification, SEO, docs/copy polish | Hermes + Steven King |

### S25 notes (X.com Account Manager review)
- Beacon must `sendBeacon` on click **before** `target="_blank"` navigation, or joins undercount.
- `sendBeacon` body: `Blob` with `application/json` — bare strings often arrive wrong.
- **Decision:** MVP join counter is KV `metrics:joins:{day}` (simpler than Analytics Engine).
- Spec step 11 (analytics) was still open — this slice closes it.

### S27 notes (MHF Research + Gateway Expert review)
- **Bump `next` 16.3.1 → `>=16.3.3` first** (lockfile peer conflict otherwise); pin
  `@opennextjs/cloudflare@1.20.6` (peer `next >=16.3.3`, `wrangler ^4.125.0`).
- Node runtime + `nodejs_compat` flag; pinned `compatibility_date`; verify the adapter's required
  flags at implement time; pin the adapter version. No `runtime = "edge"`.
- **Two KV namespaces:** `LIVE_DIRECTORY` (`snapshot:v1`) + a **separate** OpenNext ISR cache namespace.
  Never share.
- KV pattern: soft TTL via `generatedAt`, not KV expiry; 25 MiB value limit; 1 write/sec/key
  (fine under a 30-min cooldown).
- Gitignore `.open-next/`, `.wrangler/`, `.dev.vars`, `.env.local`. Runbook covers staging vs prod.
- X API facts: `GET /2/spaces/search` requires `query`; `state=live|scheduled`; empty `data` = `[]`.
  Rate limit 300/15min; five vowels ≪ that. Credits: unique-Space/day. **Fan-out ≠ full census**
  (copy constraint, see below).
- Runbook (Gateway Expert): create both KV namespaces → fill `id`/`preview_id` → 
  `opennextjs-cloudflare build` → `wrangler deploy` → post-deploy smoke (cold KV, one refresh,
  cooldown skip, last-good on X failure) → optional custom domain/routes + Web Analytics.
- Rate limiting is a **Cloudflare zone dashboard/API rule** (60/min/IP on `GET /api/spaces`), not
  just `wrangler.toml` — operator step.

### S28 notes (Novel Insight Bot falsifier review — decisions by Hazard)
Full writeup (box): `/workspace/novel-insights/xls-ingest-falsify/2026-09-09-ingest-design-review.md`
1. **Warm empty-success skew** → **DECIDED:** an all-empty successful fan-out keeps prior KV
   unchanged and returns the prior snapshot with `coverage: "cached-after-failure"`,
   `refreshed: false`. Rationale: all-empty success is far more likely a coverage/API anomaly than
   a true zero-rooms board; last-good is the honest board. Add a regression test.
2. **Cold total-failure lockout** → **DECIDED:** on total X failure with an empty cache, do **not**
   write `generatedAt=now`; return the defined empty view without poisoning the cooldown so an
   immediate retry is allowed. Add a regression test.
3. **Cooldown not single-flight** → **DECIDED:** a concurrent `POST /api/spaces/refresh` while one
   is in-flight returns `429` + `Retry-After` (credit protection). Implement before any public traffic.
4. **Vowel semantics unverified** → **DECIDED:** no live-X research spike (credit discipline + the
   repo's no-live-X rule). Copy constraint instead: UX must never imply completeness — "a broad
   sample of live Spaces", never "every live Space". (Steven King must-keep.)
- Also in S28: document that warm refresh ignores `extraKeywords` (spec behavior, keep);
  clarify `refreshed: true` means "X was called", not "KV updated";
  fix the PGS-flagged `startedAt` comment (ascending = older first; the "newer rooms stay visible"
  comment is wrong — code and tests already agree on older-first).
- **Gating:** hardening gates the **deploy (S29)**, not S23. Route wiring is not blocked by
  refresh internals.

### S29 notes (operator-gated)
- Hermes prepares: final `wrangler.toml`, secrets documented, runbook, preview deploy.
- Fate: Cloudflare login, `wrangler secret put X_API_BEARER_TOKEN`, KV namespaces, dashboard
  rate-limit rule. (Gateway Expert: live account apply needs Fate's login — never invent account IDs.)
- Howard: deploy go/no-go.
- Documented: missing bearer → refresh `500`, reads still serve last KV.

### S30 notes
- Post-deploy smoke per runbook; verify the rate-limit rule live; SEO metadata
  (title `LiveSpaces`, `robots: index,follow`, OG hero); README/docs polish;
  Steven King final copy pass (hero, empty-state "No snapshot yet. Refresh to load live Spaces.",
  errors, launch copy).

## Done definition

S23–S30 checked, `NEXT_SLICE` complete, live Cloudflare deployment serving real Spaces data behind
the Refresh button, last-good snapshot behavior verified by failing the X path in staging.

## Constraints (non-negotiable)

- **PGS/ladder hard stand-down holds.** No ladder compute, no credit burns.
- **Secrets stay in the environment.** `X_API_BEARER_TOKEN` via `.env.local` / `wrangler secret put`
  only. Never in chat, commits, or shell argv.
- **No live X in tests or CI.** Injected fetch, fixtures, fake KV, deterministic clocks.
- **Official Spaces search only.** Vowel fan-out `a e i o u`; no tweet harvest; no User expansions.
- **Copy never implies a census.** (Falsifier constraint.)
