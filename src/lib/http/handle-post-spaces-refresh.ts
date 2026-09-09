/**
 * POST /api/spaces/refresh — only X-calling snapshot writer (TECH_SPEC §7).
 *
 * Cooldown is snapshotIsFresh vs env.refreshCooldownSeconds (default 1800).
 * Optional JSON `{ q: string }` becomes extraKeywords on a cold cache only
 * (warm refresh ignores extras).
 *
 * `refreshed: true` means X was called, not that KV was updated.
 * Concurrent in-flight POSTs return 429 + Retry-After.
 */

import { liveSpacesErrorToHttp } from "@/lib/http/live-spaces-error-to-http";
import {
  IN_FLIGHT_RETRY_AFTER_SECONDS,
  createRefreshFlightGate,
  getDefaultRefreshFlightGate,
  type RefreshFlightGate,
} from "@/lib/http/refresh-flight-gate";
import { serializeDirectorySnapshot } from "@/lib/http/serialize-directory-snapshot";
import {
  refreshLiveDirectory,
  type RefreshLiveDirectoryRequest,
} from "@/lib/refresh/refresh-live-directory";

export { createRefreshFlightGate };
export type { RefreshFlightGate };

export type HandlePostSpacesRefreshDeps = Omit<
  RefreshLiveDirectoryRequest,
  "extraKeywords"
> & {
  readonly flightGate?: RefreshFlightGate;
};

async function extraKeywordsFromRequest(request: Request): Promise<readonly string[]> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return [];
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return [];
  }
  const q = (parsed as Record<string, unknown>)["q"];
  if (typeof q !== "string") {
    return [];
  }
  const trimmed = q.trim();
  return trimmed === "" ? [] : [trimmed];
}

export async function handlePostSpacesRefresh(
  request: Request,
  deps: HandlePostSpacesRefreshDeps,
): Promise<Response> {
  const gate = deps.flightGate ?? getDefaultRefreshFlightGate();
  if (!gate.tryAcquire()) {
    const http = liveSpacesErrorToHttp({
      kind: "x-api-rate-limited",
      retryAfterSeconds: IN_FLIGHT_RETRY_AFTER_SECONDS,
      message: "A refresh is already in flight",
    });
    return Response.json(http, {
      status: http.status,
      headers: { "Retry-After": String(IN_FLIGHT_RETRY_AFTER_SECONDS) },
    });
  }

  try {
    const extraKeywords = await extraKeywordsFromRequest(request);
    const result = await refreshLiveDirectory({
      cache: deps.cache,
      now: deps.now,
      readEnvironment: deps.readEnvironment,
      searchSpacesByKeyword: deps.searchSpacesByKeyword,
      extraKeywords,
    });
    if (!result.ok) {
      const http = liveSpacesErrorToHttp(result.error);
      const headers: Record<string, string> = {};
      if (http.retryAfterSeconds !== undefined) {
        headers["Retry-After"] = String(http.retryAfterSeconds);
      }
      return Response.json(http, { status: http.status, headers });
    }

    const serialized = serializeDirectorySnapshot(result.value.snapshot);
    if (!serialized.ok) {
      const http = liveSpacesErrorToHttp(serialized.error);
      return Response.json(http, { status: http.status });
    }

    return Response.json(
      {
        ...serialized.value,
        refreshed: result.value.refreshed,
      },
      { status: 200 },
    );
  } finally {
    gate.release();
  }
}
