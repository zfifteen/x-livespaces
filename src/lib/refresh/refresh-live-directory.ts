/**
 * On-demand rebuild of the unfiltered live directory.
 *
 * Called by POST /api/spaces/refresh under the global cooldown.
 *
 * Intended control flow (MVP, TECH_SPEC v1.3):
 * 1. Read env (bearer, cooldown seconds).
 * 2. If snapshot is fresh (< cooldown), return { snapshot, refreshed: false }
 *    without calling X.
 * 3. Build the keyword fan-out list (vowels a e i o u). If the visitor
 *    supplied a keyword on a cold cache, prepend it.
 * 4. For each keyword, searchSpacesByKeyword (state=live).
 * 5. mergeDirectorySources on the official batches.
 * 6. Count live cards for liveCount.
 * 7. Write snapshot with coverage "official-search" when any cards arrive
 *    or the cache is empty. On total X failure with a prior snapshot, leave
 *    KV unchanged and return that snapshot with coverage
 *    "cached-after-failure" when the view needs it.
 * 8. Return { snapshot, refreshed: true } when X was called.
 *
 * No tweet / public-post harvest. No cron. Load-time filters stay in
 * loadLiveDirectory.
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

export type RefreshLiveDirectoryResult = {
  readonly snapshot: DirectorySnapshot;
  readonly refreshed: boolean;
};

export function refreshLiveDirectory(
  request: RefreshLiveDirectoryRequest,
): Promise<Result<RefreshLiveDirectoryResult, LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("refreshLiveDirectory"));
}
