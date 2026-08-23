/**
 * Union official search result batches by SpaceId and rank them.
 *
 * MVP has one source only: official Spaces search. Public-post harvest is
 * out of scope, so there is no second list to merge.
 *
 * Intended logic:
 * 1. Accept one or more official-search card batches.
 * 2. Deduplicate by spaceId (first occurrence wins; later batches drop dupes).
 * 3. Stable-sort: live first, then listenerCount descending, then startedAt
 *    ascending so newer rooms stay visible; undefined dates sort last.
 * 4. sourceKind remains official-api on every card.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type MergeDirectorySourcesInput = {
  readonly officialBatches: readonly (readonly LiveSpaceCard[])[];
};

export function mergeDirectorySources(
  input: MergeDirectorySourcesInput,
): Result<readonly LiveSpaceCard[], LiveSpacesError> {
  void input;
  return notImplementedYet("mergeDirectorySources");
}
