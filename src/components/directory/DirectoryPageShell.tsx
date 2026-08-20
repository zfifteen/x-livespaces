/**
 * Full directory chrome: count, search, filters, grid, recently shared.
 *
 * The home page passes an empty snapshot during Phase 1. Phase 3 loads
 * `DirectorySnapshot` from `loadLiveDirectory` and feeds it here.
 */

import { DirectoryFilterBar } from "@/components/directory/DirectoryFilterBar";
import { DirectorySearchBar } from "@/components/directory/DirectorySearchBar";
import { LiveSpaceCount } from "@/components/directory/LiveSpaceCount";
import { LiveSpaceGrid } from "@/components/directory/LiveSpaceGrid";
import { RecentlySharedSpaces } from "@/components/directory/RecentlySharedSpaces";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";

type DirectoryPageShellProps = {
  readonly snapshot: DirectorySnapshot | undefined;
};

export function DirectoryPageShell({ snapshot }: DirectoryPageShellProps) {
  const filters = snapshot?.appliedFilters ?? DEFAULT_DIRECTORY_FILTERS;
  const visibleCards = snapshot?.visibleCards ?? [];
  const recentlySharedCards = snapshot?.recentlySharedCards ?? [];

  return (
    <main className="directory">
      <header className="directory__hero">
        <h1>LiveSpaces</h1>
        <p>The public directory for live conversations on X.</p>
        <LiveSpaceCount count={snapshot?.liveCount} generatedAt={snapshot?.generatedAt} />
      </header>
      <DirectorySearchBar filters={filters} />
      <DirectoryFilterBar filters={filters} />
      <LiveSpaceGrid cards={visibleCards} />
      <RecentlySharedSpaces cards={recentlySharedCards} />
    </main>
  );
}
