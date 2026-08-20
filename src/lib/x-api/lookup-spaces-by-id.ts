/**
 * Enrich known Space ids (from public post links, or stale cache rows).
 *
 * Endpoint: GET /2/spaces and GET /2/spaces/:id
 *
 * Intended logic:
 * 1. Chunk ids (API allows a comma-separated list; keep chunks small).
 * 2. Request the same space.fields + user expansions as search.
 * 3. Map successes to cards. Ended Spaces disappear from the API — treat
 *    missing ids as "drop from directory", not as a hard failure.
 * 4. A total transport failure of a chunk is `x-api-unavailable` / rate-limit.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";
import type { SpaceId } from "@/domain/branded-ids";
import type { LiveSpaceCard } from "@/domain/live-space-card";

export type LookupSpacesByIdRequest = {
  readonly bearerToken: string;
  readonly spaceIds: readonly SpaceId[];
};

export function lookupSpacesById(
  request: LookupSpacesByIdRequest,
): Promise<Result<readonly LiveSpaceCard[], LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("lookupSpacesById"));
}
