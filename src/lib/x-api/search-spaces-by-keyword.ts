/**
 * Official live/scheduled Space search.
 *
 * Endpoint: GET /2/spaces/search
 * Required query parameter: `query` (keyword). There is no unfiltered
 * "every live Space" call; the directory fan-out layer supplies keywords.
 *
 * Intended logic:
 * 1. Reject empty keywords (caller should use fan-out or public-link harvest).
 * 2. Request `state=live` (or scheduled when filters.liveOnly is false).
 * 3. Ask for space.fields: title, host_ids, creator_id, participant_count,
 *    started_at, scheduled_start, lang, state, topic_ids.
 * 4. Expand `creator_id,host_ids` into user objects for avatars/handles.
 * 5. Map each payload row through `mapOfficialSpaceToCard`.
 * 6. Drop rows that fail mapping; collect mapping errors for logs, keep the rest.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import type { SpaceLifecycleState } from "@/domain/live-space-card";

export type SearchSpacesByKeywordRequest = {
  readonly bearerToken: string;
  readonly keywordQuery: string;
  readonly state: SpaceLifecycleState;
};

export function searchSpacesByKeyword(
  request: SearchSpacesByKeywordRequest,
): Promise<Result<readonly LiveSpaceCard[], LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("searchSpacesByKeyword"));
}
