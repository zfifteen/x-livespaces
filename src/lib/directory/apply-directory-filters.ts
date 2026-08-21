/**
 * Pure filter of already-fetched cards. Runs after merge, before the grid.
 *
 * Intended logic:
 * 1. If liveOnly, keep `lifecycleState === "live"`.
 * 2. Keep cards with `listenerCount >= minimumListenerCount`.
 * 3. If languageCode is set, keep exact match on `card.languageCode`.
 *    Cards with undefined language drop out of a language-specific view.
 * 4. If keywordQuery is non-empty after trim, case-insensitive match against
 *    title and topic tags only (no host fields in MVP).
 * 5. Preserve original relative order (API relevance / merge order).
 *
 * This function always succeeds for a well-typed `DirectoryFilters` value.
 * Validation belongs in `directoryFiltersFromSearchParams`.
 */

import type { DirectoryFilters } from "@/domain/directory-filters";
import type { LiveSpaceCard } from "@/domain/live-space-card";

export function applyDirectoryFilters(
  cards: readonly LiveSpaceCard[],
  filters: DirectoryFilters,
): readonly LiveSpaceCard[] {
  // Phase 1: empty list so callers typecheck. Phase 3 replaces this body.
  void cards;
  void filters;
  return [];
}
