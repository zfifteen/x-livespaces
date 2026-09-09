/**
 * SSR directory load for GET /. Never calls X (TECH_SPEC §8).
 */

import {
  DEFAULT_DIRECTORY_FILTERS,
  directoryFiltersFromSearchParams,
} from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { loadLiveDirectory } from "@/lib/directory/load-live-directory";

export type LoadHomeDirectoryDeps = {
  readonly cache: LiveDirectoryCache;
  readonly now: Date;
};

export async function loadHomeDirectorySnapshot(
  searchParams: URLSearchParams,
  deps: LoadHomeDirectoryDeps,
): Promise<DirectorySnapshot | undefined> {
  const filtersResult = directoryFiltersFromSearchParams(searchParams);
  const filters = filtersResult.ok
    ? filtersResult.value
    : DEFAULT_DIRECTORY_FILTERS;
  const result = await loadLiveDirectory({
    filters,
    cache: deps.cache,
    now: deps.now,
  });
  if (!result.ok) {
    return undefined;
  }
  return result.value;
}
