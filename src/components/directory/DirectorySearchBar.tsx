/**
 * Keyword search. Phase 3 will submit `q` to the directory URL / API.
 *
 * Presentational for Phase 1: the form posts GET `/` with `q` so the skeleton
 * has a real HTML contract without client JS.
 */

import type { DirectoryFilters } from "@/domain/directory-filters";

type DirectorySearchBarProps = {
  readonly filters: DirectoryFilters;
};

export function DirectorySearchBar({ filters }: DirectorySearchBarProps) {
  return (
    <form className="directory-search" method="get" action="/" role="search">
      <label htmlFor="directory-search-q">Search live Spaces</label>
      <input
        id="directory-search-q"
        name="q"
        type="search"
        defaultValue={filters.keywordQuery}
        placeholder="Search by topic, host, or keyword"
        autoComplete="off"
      />
      {filters.liveOnly ? <input type="hidden" name="live" value="1" /> : null}
      <input type="hidden" name="minListeners" value={String(filters.minimumListenerCount)} />
      {filters.languageCode ? (
        <input type="hidden" name="lang" value={filters.languageCode} />
      ) : null}
      <button type="submit">Search</button>
    </form>
  );
}
