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
  const keyword = filters.keywordQuery.trim().toLowerCase();
  const hasKeyword = keyword.length > 0;
  const languageFilter = filters.languageCode;

  return cards.filter((card) => {
    if (filters.liveOnly && card.lifecycleState !== "live") {
      return false;
    }
    if (card.listenerCount < filters.minimumListenerCount) {
      return false;
    }
    if (languageFilter !== undefined) {
      if (card.languageCode !== languageFilter) {
        return false;
      }
    }
    if (hasKeyword) {
      const titleMatch = card.title.toLowerCase().includes(keyword);
      const tagMatch = card.topicTags.some((tag) =>
        tag.toLowerCase().includes(keyword),
      );
      if (!titleMatch && !tagMatch) {
        return false;
      }
    }
    return true;
  });
}
