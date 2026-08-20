/**
 * Background / on-demand rebuild of the unfiltered live directory.
 *
 * Called by the poll job and by `loadLiveDirectory` on cache miss.
 *
 * Intended control flow:
 * 1. Read env (bearer, poll interval).
 * 2. Build the keyword fan-out list. If the visitor supplied a keyword,
 *    prepend it so search is still covered on a cold cache.
 * 3. For each keyword, `searchSpacesByKeyword` with staggered delay so
 *    we stay under rate limits (CONCEPT §6).
 * 4. `searchPublicPostsForSpaceLinks` then `lookupSpacesById`.
 * 5. `mergeDirectorySources`.
 * 6. Count live cards for `liveCount`.
 * 7. Write snapshot `{ generatedAt: now, liveCount, visibleCards: merged,
 *    recentlySharedCards: public/merged subset, appliedFilters: defaults }`.
 *    Load-time request filters are applied later in `loadLiveDirectory`.
 */

import { notImplementedYet } from "@/domain/result";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";

export type RefreshLiveDirectoryRequest = {
  readonly cache: LiveDirectoryCache;
  readonly now: Date;
  readonly extraKeywords: readonly string[];
};

export function refreshLiveDirectory(
  request: RefreshLiveDirectoryRequest,
): Promise<Result<DirectorySnapshot, LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("refreshLiveDirectory"));
}
