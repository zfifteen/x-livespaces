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

import { ok } from "@/domain/result";
import type { LiveSpaceCard, SpaceLifecycleState } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type MergeDirectorySourcesInput = {
  readonly officialBatches: readonly (readonly LiveSpaceCard[])[];
};

const LIFECYCLE_RANK: Record<SpaceLifecycleState, number> = {
  live: 0,
  scheduled: 1,
  ended: 2,
};

function compareCards(a: LiveSpaceCard, b: LiveSpaceCard): number {
  const lifeDiff = LIFECYCLE_RANK[a.lifecycleState] - LIFECYCLE_RANK[b.lifecycleState];
  if (lifeDiff !== 0) {
    return lifeDiff;
  }

  const listenerDiff = b.listenerCount - a.listenerCount;
  if (listenerDiff !== 0) {
    return listenerDiff;
  }

  const aStart = a.startedAt?.getTime();
  const bStart = b.startedAt?.getTime();
  if (aStart === undefined && bStart === undefined) {
    return 0;
  }
  if (aStart === undefined) {
    return 1;
  }
  if (bStart === undefined) {
    return -1;
  }
  return aStart - bStart;
}

export function mergeDirectorySources(
  input: MergeDirectorySourcesInput,
): Result<readonly LiveSpaceCard[], LiveSpacesError> {
  const seen = new Set<string>();
  const unique: LiveSpaceCard[] = [];

  for (const batch of input.officialBatches) {
    for (const card of batch) {
      const id = card.spaceId;
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
      unique.push(card);
    }
  }

  // Stable sort: Array.prototype.sort is stable in modern JS engines.
  unique.sort(compareCards);

  return ok(unique);
}
