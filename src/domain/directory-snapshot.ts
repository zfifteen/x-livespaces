import type { DirectoryFilters } from "@/domain/directory-filters";
import type { LiveSpaceCard } from "@/domain/live-space-card";

/**
 * One consistent view of the directory at a refresh instant.
 *
 * `liveCount` is the number of cards with `lifecycleState === "live"` *before*
 * keyword/min-listener filters, so the hero counter stays a platform-wide
 * "how many are live" number even when the grid is filtered.
 */
export type DirectorySnapshot = {
  readonly generatedAt: Date;
  readonly liveCount: number;
  readonly appliedFilters: DirectoryFilters;
  readonly visibleCards: readonly LiveSpaceCard[];
  readonly recentlySharedCards: readonly LiveSpaceCard[];
};
