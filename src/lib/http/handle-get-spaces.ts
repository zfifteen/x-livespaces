/**
 * GET /api/spaces — public JSON directory (TECH_SPEC §8).
 *
 * Reads the shared cache via loadLiveDirectory. Never calls X.
 * CORS is `Access-Control-Allow-Origin: *` on this route only.
 */

import { directoryFiltersFromSearchParams } from "@/domain/directory-filters";
import { snapshotIsFresh, type LiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { loadLiveDirectory } from "@/lib/directory/load-live-directory";
import { liveSpacesErrorToHttp } from "@/lib/http/live-spaces-error-to-http";
import { serializeDirectorySnapshot } from "@/lib/http/serialize-directory-snapshot";

export const GET_SPACES_CORS_ORIGIN = "*";

export type HandleGetSpacesDeps = {
  readonly cache: LiveDirectoryCache;
  readonly now: Date;
  readonly refreshCooldownSeconds: number;
};

function jsonResponse(
  body: unknown,
  status: number,
  extraHeaders: Record<string, string> = {},
): Response {
  return Response.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": GET_SPACES_CORS_ORIGIN,
      ...extraHeaders,
    },
  });
}

export async function handleGetSpaces(
  request: Request,
  deps: HandleGetSpacesDeps,
): Promise<Response> {
  const url = new URL(request.url);
  const filtersResult = directoryFiltersFromSearchParams(url.searchParams);
  if (!filtersResult.ok) {
    const http = liveSpacesErrorToHttp(filtersResult.error);
    return jsonResponse(http, http.status);
  }

  const loadResult = await loadLiveDirectory({
    filters: filtersResult.value,
    cache: deps.cache,
    now: deps.now,
  });
  if (!loadResult.ok) {
    const http = liveSpacesErrorToHttp(loadResult.error);
    return jsonResponse(http, http.status);
  }

  const snapshot = loadResult.value;
  const serialized = serializeDirectorySnapshot(snapshot);
  if (!serialized.ok) {
    const http = liveSpacesErrorToHttp(serialized.error);
    return jsonResponse(http, http.status);
  }

  const stale = !snapshotIsFresh(
    snapshot,
    deps.now,
    deps.refreshCooldownSeconds,
  );

  return jsonResponse(
    {
      ...serialized.value,
      stale,
    },
    200,
  );
}
