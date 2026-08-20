import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

/**
 * MVP filter bar from CONCEPT §4: live-only, minimum listeners, language, keyword.
 *
 * Phase 2 adds categories, host follower count, and topic pages; keep those
 * fields off this type until that work starts.
 */
export type DirectoryFilters = {
  readonly keywordQuery: string;
  readonly liveOnly: boolean;
  readonly minimumListenerCount: number;
  readonly languageCode: string | undefined;
};

export const DEFAULT_DIRECTORY_FILTERS: DirectoryFilters = {
  keywordQuery: "",
  liveOnly: true,
  minimumListenerCount: 0,
  languageCode: undefined,
};

/**
 * Parse query-string values from `/api/spaces` or the directory URL.
 *
 * Intended logic:
 * 1. Treat missing `q` as empty keyword (browse / fan-out mode).
 * 2. `live` query: use the last `live` value (the filter form sends hidden `0`
 *    then checkbox `1`). `1` / missing → liveOnly true; `0` allows scheduled.
 * 3. `minListeners` must be a non-negative integer; default 0.
 * 4. `lang` is an optional BCP-47-ish short code (`en`, `ja`); empty string → undefined.
 * 5. Reject NaN / negative minListeners with `invalid-filters`.
 */
export function directoryFiltersFromSearchParams(
  searchParams: URLSearchParams,
): Result<DirectoryFilters, LiveSpacesError> {
  void searchParams;
  return notImplementedYet("directoryFiltersFromSearchParams");
}
