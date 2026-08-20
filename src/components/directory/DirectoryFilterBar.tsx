/**
 * MVP filters: live only, minimum listeners, language (CONCEPT §4).
 *
 * GET form so filters round-trip as query params without client state.
 */

import type { DirectoryFilters } from "@/domain/directory-filters";

type DirectoryFilterBarProps = {
  readonly filters: DirectoryFilters;
};

export function DirectoryFilterBar({ filters }: DirectoryFilterBarProps) {
  return (
    <form className="directory-filters" method="get" action="/">
      <input type="hidden" name="q" value={filters.keywordQuery} />
      <label>
        <input type="hidden" name="live" value="0" />
        <input type="checkbox" name="live" value="1" defaultChecked={filters.liveOnly} />
        Live only
      </label>
      <label>
        Minimum listeners
        <input
          type="number"
          name="minListeners"
          min={0}
          defaultValue={filters.minimumListenerCount}
        />
      </label>
      <label>
        Language
        <input type="text" name="lang" defaultValue={filters.languageCode ?? ""} placeholder="en" />
      </label>
      <button type="submit">Apply filters</button>
    </form>
  );
}
