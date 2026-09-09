/**
 * Full directory chrome: count, search, filters, grid, Refresh.
 *
 * Recently Shared rail is out of MVP.
 */

import { DirectoryFilterBar } from "@/components/directory/DirectoryFilterBar";
import { DirectoryRefreshControl } from "@/components/directory/DirectoryRefreshControl";
import { DirectorySearchBar } from "@/components/directory/DirectorySearchBar";
import { LiveSpaceCount } from "@/components/directory/LiveSpaceCount";
import { LiveSpaceGrid } from "@/components/directory/LiveSpaceGrid";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import { LIVE_SPACES_DESCRIPTION, LIVE_SPACES_TITLE } from "@/lib/seo/live-spaces-metadata";

type DirectoryPageShellProps = {
  readonly snapshot: DirectorySnapshot | undefined;
};

export function DirectoryPageShell({ snapshot }: DirectoryPageShellProps) {
  const filters = snapshot?.appliedFilters ?? DEFAULT_DIRECTORY_FILTERS;
  const visibleCards = snapshot?.visibleCards ?? [];
  const generatedAtIso =
    snapshot?.coverage !== undefined
      ? snapshot.generatedAt.toISOString()
      : undefined;

  return (
    <main className="directory">
      <header className="directory__hero">
        <h1>{LIVE_SPACES_TITLE}</h1>
        <p>{LIVE_SPACES_DESCRIPTION}</p>
        <LiveSpaceCount
          count={snapshot?.liveCount}
          generatedAt={snapshot?.generatedAt}
        />
        <DirectoryRefreshControl generatedAtIso={generatedAtIso} />
      </header>
      <DirectorySearchBar filters={filters} />
      <DirectoryFilterBar filters={filters} />
      <LiveSpaceGrid cards={visibleCards} />
    </main>
  );
}
