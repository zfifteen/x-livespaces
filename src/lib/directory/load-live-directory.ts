/**
 * Composition root for the directory page and GET /api/spaces.
 *
 * Intended control flow (MVP, TECH_SPEC v1.3):
 * 1. Parse / validate filters (caller may pass already-parsed filters).
 * 2. Read cache once. Never call X or refresh from the read path.
 * 3. Missing snapshot → defined empty view with caller filters.
 * 4. Existing snapshot → apply filters to stored cards; preserve unfiltered
 *    liveCount and stored generatedAt.
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
