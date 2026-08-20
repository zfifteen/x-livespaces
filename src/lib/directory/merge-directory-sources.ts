/**
 * Union official search hits with enriched public-link Spaces, keyed by SpaceId.
 *
 * Intended logic:
 * 1. Index official cards by spaceId.
 * 2. For each public-link card: if the id exists, clone the official card
 *    with `sourceKind: "merged"`; otherwise keep the public-link card.
 * 3. Append remaining official-only cards.
 * 4. Stable-sort: live first, then listenerCount descending, then startedAt
 *    ascending so new rooms stay visible.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type MergeDirectorySourcesInput = {
  readonly officialCards: readonly LiveSpaceCard[];
  readonly publicLinkCards: readonly LiveSpaceCard[];
};

export function mergeDirectorySources(
  input: MergeDirectorySourcesInput,
): Result<readonly LiveSpaceCard[], LiveSpacesError> {
  void input;
  return notImplementedYet("mergeDirectorySources");
}
