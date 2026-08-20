/**
 * Keyword set used when the visitor has not typed a search.
 *
 * Official `/2/spaces/search` requires `query`. To populate a browse
 * directory we search a small, stable list of high-yield terms and merge
 * by SpaceId. Public-link harvest covers rooms these terms miss.
 *
 * Intended logic:
 * 1. Start with a named constant list (news, crypto, music, sports, tech, …).
 * 2. Deduplicate case-insensitively.
 * 3. Keep the list short enough to stay inside rate limits at a 30–60s poll.
 * 4. Later: derive extra terms from trending topics / saved searches.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export const DEFAULT_LIVE_DIRECTORY_KEYWORDS: readonly string[] = [
  "news",
  "crypto",
  "bitcoin",
  "tech",
  "ai",
  "music",
  "sports",
  "politics",
  "gaming",
  "spaces",
];

export function fanOutLiveSpaceKeywords(
  extraKeywords: readonly string[] = [],
): Result<readonly string[], LiveSpacesError> {
  void extraKeywords;
  return notImplementedYet("fanOutLiveSpaceKeywords");
}
