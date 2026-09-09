/**
 * POST /api/spaces/refresh — only X-calling snapshot writer (TECH_SPEC §7).
 *
 * Cooldown is snapshotIsFresh vs env.refreshCooldownSeconds (default 1800).
 * Optional JSON `{ q: string }` becomes extraKeywords on a cold cache only
 * (refreshLiveDirectory already ignores extras when warm).
 */

import { liveSpacesErrorToHttp } from "@/lib/http/live-spaces-error-to-http";
import { serializeDirectorySnapshot } from "@/lib/http/serialize-directory-snapshot";
import {
  refreshLiveDirectory,
  type RefreshLiveDirectoryRequest,
} from "@/lib/refresh/refresh-live-directory";

export type HandlePostSpacesRefreshDeps = Omit<
  RefreshLiveDirectoryRequest,
  "extraKeywords"
>;

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
  const extraKeywords = await extraKeywordsFromRequest(request);
  const result = await refreshLiveDirectory({
    ...deps,
    extraKeywords,
  });
  if (!result.ok) {
    const http = liveSpacesErrorToHttp(result.error);
    return Response.json(http, { status: http.status });
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
}
