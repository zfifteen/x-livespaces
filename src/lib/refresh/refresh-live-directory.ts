/**
 * On-demand rebuild of the unfiltered live directory.
 *
 * Called by POST /api/spaces/refresh under the global cooldown.
 *
 * Control flow (MVP, TECH_SPEC v1.3):
 * 1. Read env (bearer, cooldown seconds).
 * 2. If snapshot is fresh (< cooldown), return { snapshot, refreshed: false }
 *    without calling X.
 * 3. Build the keyword fan-out list (vowels a e i o u). If the visitor
 *    supplied a keyword on a cold cache, prepend it.
 * 4. For each keyword, searchSpacesByKeyword (state=live). Collect successes;
 *    tolerate per-keyword failures so partial fan-out still yields a usable set.
 * 5. mergeDirectorySources on the successful official batches.
 * 6. Count live cards for liveCount.
 * 7. Write snapshot with coverage "official-search" when any cards arrive
 *    or the cache is empty. On total X failure with a prior snapshot, leave
 *    KV unchanged and return the prior marked coverage "cached-after-failure".
 * 8. Return { snapshot, refreshed: true } when X was called.
 *
 * No tweet / public-post harvest. No cron. Load-time filters stay in
 * loadLiveDirectory.
 */

import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { ok, type Result } from "@/domain/result";
import {
  snapshotIsFresh,
  type LiveDirectoryCache,
} from "@/lib/cache/live-directory-cache";
import { mergeDirectorySources } from "@/lib/directory/merge-directory-sources";
import type { LiveSpacesEnvironment } from "@/lib/env/read-live-spaces-environment";
import { fanOutLiveSpaceKeywords } from "@/lib/x-api/fan-out-live-space-keywords";
import type { SearchSpacesByKeywordRequest } from "@/lib/x-api/search-spaces-by-keyword";

export type SearchSpacesByKeywordFn = (
  request: SearchSpacesByKeywordRequest,
) => Promise<Result<readonly LiveSpaceCard[], LiveSpacesError>>;

export type RefreshLiveDirectoryRequest = {
  readonly cache: LiveDirectoryCache;
  readonly now: Date;
  /** Visitor q; used only when cache is cold (no prior snapshot). */
  readonly extraKeywords: readonly string[];
  readonly readEnvironment: () => Result<LiveSpacesEnvironment, LiveSpacesError>;
  readonly searchSpacesByKeyword: SearchSpacesByKeywordFn;
};

export type RefreshLiveDirectoryResult = {
  readonly snapshot: DirectorySnapshot;
  readonly refreshed: boolean;
};

function countLive(cards: readonly LiveSpaceCard[]): number {
  let n = 0;
  for (const c of cards) {
    if (c.lifecycleState === "live") {
      n += 1;
    }
  }
  return n;
}

export async function refreshLiveDirectory(
  request: RefreshLiveDirectoryRequest,
): Promise<Result<RefreshLiveDirectoryResult, LiveSpacesError>> {
  const envResult = request.readEnvironment();
  if (!envResult.ok) {
    return envResult;
  }
  const env = envResult.value;

  const readResult = await request.cache.readSnapshot();
  if (!readResult.ok) {
    return readResult;
  }
  const prior = readResult.value;

  if (
    prior !== undefined &&
    snapshotIsFresh(prior, request.now, env.refreshCooldownSeconds)
  ) {
    return ok({ snapshot: prior, refreshed: false });
  }

  const isCold = prior === undefined;
  const keywordResult = fanOutLiveSpaceKeywords(
    isCold ? request.extraKeywords : [],
  );
  if (!keywordResult.ok) {
    return keywordResult;
  }
  const keywords = keywordResult.value;

  const batches: (readonly LiveSpaceCard[])[] = [];
  let anySearchSucceeded = false;

  for (const keyword of keywords) {
    const searchResult = await request.searchSpacesByKeyword({
      bearerToken: env.xApiBearerToken,
      keywordQuery: keyword,
      state: "live",
    });
    if (!searchResult.ok) {
      continue;
    }
    anySearchSucceeded = true;
    batches.push(searchResult.value);
  }

  // Total X failure: every keyword search failed.
  if (!anySearchSucceeded) {
    if (prior !== undefined) {
      // Leave stored snapshot unchanged. Return a view marked cached-after-failure.
      const recovered: DirectorySnapshot = {
        ...prior,
        coverage: "cached-after-failure",
      };
      return ok({ snapshot: recovered, refreshed: true });
    }
    // Cold cache + total failure: empty initial board (write empty official-search).
    const empty: DirectorySnapshot = {
      generatedAt: request.now,
      liveCount: 0,
      appliedFilters: DEFAULT_DIRECTORY_FILTERS,
      visibleCards: [],
      coverage: "official-search",
    };
    const writeResult = await request.cache.writeSnapshot(empty);
    if (!writeResult.ok) {
      return writeResult;
    }
    return ok({ snapshot: empty, refreshed: true });
  }

  const mergeResult = mergeDirectorySources({ officialBatches: batches });
  if (!mergeResult.ok) {
    return mergeResult;
  }
  const visibleCards = mergeResult.value;
  const liveCount = countLive(visibleCards);

  const snapshot: DirectorySnapshot = {
    generatedAt: request.now,
    liveCount,
    appliedFilters: DEFAULT_DIRECTORY_FILTERS,
    visibleCards,
    coverage: "official-search",
  };

  // Write when we have cards, or when cache was empty (initial empty board).
  // Partial success always writes the usable merge.
  if (visibleCards.length > 0 || isCold) {
    const writeResult = await request.cache.writeSnapshot(snapshot);
    if (!writeResult.ok) {
      return writeResult;
    }
  }

  return ok({ snapshot, refreshed: true });
}
