/**
 * Composition root for the directory page and GET /api/spaces.
 *
 * Intended control flow:
 * 1. Parse / validate filters (caller may pass already-parsed filters).
 * 2. Read cache. If a snapshot is fresh, apply filters to cached cards and
 *    return (liveCount stays the unfiltered live tally from the snapshot).
 * 3. Otherwise call `refreshLiveDirectory` (which writes the cache).
 * 4. Apply filters to the fresh snapshot's cards.
 * 5. recentlySharedCards: cards whose sourceKind is public-post-link or merged,
 *    capped to a small list for the "Recently shared" rail.
 *
 * Partial source failure: if official search fails and public links succeed,
 * still return what we have and let the API layer surface a warning later.
 * Total failure of both sources: return the error.
 */

import { notImplementedYet } from "@/domain/result";
import type { DirectoryFilters } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";

export type LoadLiveDirectoryRequest = {
  readonly filters: DirectoryFilters;
  readonly cache: LiveDirectoryCache;
  readonly now: Date;
};

export function loadLiveDirectory(
  request: LoadLiveDirectoryRequest,
): Promise<Result<DirectorySnapshot, LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("loadLiveDirectory"));
}
