/**
 * Composition root for the directory page and GET /api/spaces.
 *
 * Intended control flow (MVP, TECH_SPEC v1.3):
 * 1. Caller supplies already-parsed DirectoryFilters.
 * 2. Read cache once. Never call X or refresh from the read path.
 * 3. Missing snapshot → defined empty view with caller filters and
 *    generatedAt = now.
 * 4. Existing snapshot → apply filters to stored cards; preserve unfiltered
 *    liveCount, stored generatedAt, and optional coverage.
 */

import type { DirectoryFilters } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import { ok, type Result } from "@/domain/result";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { applyDirectoryFilters } from "@/lib/directory/apply-directory-filters";

export type LoadLiveDirectoryRequest = {
  readonly filters: DirectoryFilters;
  readonly cache: LiveDirectoryCache;
  readonly now: Date;
};

export async function loadLiveDirectory(
  request: LoadLiveDirectoryRequest,
): Promise<Result<DirectorySnapshot, LiveSpacesError>> {
  const readResult = await request.cache.readSnapshot();
  if (!readResult.ok) {
    return readResult;
  }

  const stored = readResult.value;
  if (stored === undefined) {
    return ok({
      generatedAt: request.now,
      liveCount: 0,
      appliedFilters: request.filters,
      visibleCards: [],
    });
  }

  const filtered = applyDirectoryFilters(stored.visibleCards, request.filters);

  const view: DirectorySnapshot = {
    generatedAt: stored.generatedAt,
    liveCount: stored.liveCount,
    appliedFilters: request.filters,
    visibleCards: filtered,
  };
  if (stored.coverage !== undefined) {
    return ok({ ...view, coverage: stored.coverage });
  }
  return ok(view);
}
