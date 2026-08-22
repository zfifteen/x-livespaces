/**
 * On-demand rebuild of the unfiltered live directory.
 *
 * Called by POST /api/spaces/refresh under the global cooldown.
 *
 * Intended control flow (MVP, TECH_SPEC v1.3):
 * 1. Read env (bearer, cooldown).
 * 2. If snapshot is fresh (< 1800s), return it without calling X.
 * 3. Build the keyword fan-out list (vowels a e i o u). If the visitor
 *    supplied a keyword on a cold cache, prepend it.
 * 4. For each keyword, `searchSpacesByKeyword`.
 * 5. `mergeDirectorySources`.
 * 6. Count live cards for `liveCount`.
 * 7. Write snapshot with coverage official-search (or retain last-good on total failure).
 *    Load-time request filters are applied later in `loadLiveDirectory`.
 * No tweet / public-post harvest in MVP. No cron.
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
