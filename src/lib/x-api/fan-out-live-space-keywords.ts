/**
 * Keyword set used when the visitor has not typed a search.
 *
 * Official `/2/spaces/search` requires `query`. MVP browse uses five vowel
 * queries so a single Refresh covers a broad slice of live rooms without
 * topic curation. Union results by Space id.
 *
 * Intended logic:
 * 1. Start with DEFAULT_LIVE_DIRECTORY_KEYWORDS: exactly a, e, i, o, u.
 * 2. Optionally prepend a visitor-supplied keyword (cold-cache search).
 * 3. Deduplicate case-insensitively while preserving order.
 * 4. Keep the list short; five searches stay inside Spaces search rate limits
 *    under the 30-minute global cooldown.
 */

import { ok } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export const DEFAULT_LIVE_DIRECTORY_KEYWORDS: readonly string[] = [
  "a",
  "e",
  "i",
  "o",
  "u",
];

/**
 * Build the ordered keyword list for a Refresh fan-out.
 *
 * Prepends trimmed non-blank extras, then the five vowels. Deduplicates
 * case-insensitively so the first spelling wins. Never returns blanks.
 */
export function fanOutLiveSpaceKeywords(
  extraKeywords: readonly string[] = [],
): Result<readonly string[], LiveSpacesError> {
  const seen = new Set<string>();
  const out: string[] = [];

  const consider = (raw: string): void => {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    out.push(trimmed);
  };

  for (const extra of extraKeywords) {
    consider(extra);
  }
  for (const vowel of DEFAULT_LIVE_DIRECTORY_KEYWORDS) {
    consider(vowel);
  }

  return ok(out);
}
