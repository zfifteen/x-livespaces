/**
 * Enrich known Space ids (from stale cache rows or future Phase 2 sources).
 *
 * Endpoint: GET /2/spaces?ids=...
 *
 * Intended logic (MVP — no User expansions):
 * 1. Return empty success when spaceIds is empty (no fetch).
 * 2. Chunk ids (API allows a comma-separated list; max 100 per request).
 * 3. Request the same space.fields as search. Do not request expansions.
 * 4. Map successes to cards. Ended / unknown Spaces disappear from the API —
 *    treat missing ids as "drop from directory", not as a hard failure.
 * 5. Drop unreadable rows; keep the rest.
 * 6. A total transport failure of any chunk is `x-api-unavailable` / rate-limit.
 */

import type { LiveSpacesError } from "@/domain/errors";
import type { SpaceId } from "@/domain/branded-ids";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { err, ok, type Result } from "@/domain/result";
import { getOfficialXApiJson } from "@/lib/x-api/official-x-api-client";
import { mapOfficialSpaceToCard } from "@/lib/x-api/map-official-space-to-card";

export type LookupSpacesByIdRequest = {
  readonly bearerToken: string;
  readonly spaceIds: readonly SpaceId[];
};

const SPACE_FIELDS =
  "title,participant_count,started_at,scheduled_start,lang,state";

/** Official docs allow up to 100 ids per lookup request. */
export const LOOKUP_SPACES_BY_ID_CHUNK_SIZE = 100;

type FetchFn = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Build the path+query for GET /2/spaces (multi-id lookup).
 * Never requests expansions or user.fields.
 */
export function buildSpacesLookupPathAndQuery(
  spaceIds: readonly SpaceId[],
): string {
  const params = new URLSearchParams();
  params.set("ids", spaceIds.join(","));
  params.set("space.fields", SPACE_FIELDS);
  return `/spaces?${params.toString()}`;
}

function chunkIds(
  spaceIds: readonly SpaceId[],
  chunkSize: number,
): SpaceId[][] {
  const chunks: SpaceId[][] = [];
  for (let i = 0; i < spaceIds.length; i += chunkSize) {
    chunks.push([...spaceIds.slice(i, i + chunkSize)]);
  }
  return chunks;
}

async function lookupOneChunk(
  bearerToken: string,
  spaceIds: readonly SpaceId[],
  fetchImpl: FetchFn,
): Promise<Result<readonly LiveSpaceCard[], LiveSpacesError>> {
  const pathAndQuery = buildSpacesLookupPathAndQuery(spaceIds);

  const jsonResult = await getOfficialXApiJson(
    {
      bearerToken,
      pathAndQuery,
    },
    fetchImpl,
  );

  if (!jsonResult.ok) {
    return jsonResult;
  }

  const body = jsonResult.value;
  if (!isRecord(body)) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "Official Spaces lookup response is not an object",
    });
  }

  const data = body["data"];
  // Official API omits `data` when none of the ids are available.
  if (data === undefined || data === null) {
    return ok([]);
  }

  if (!Array.isArray(data)) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "Official Spaces lookup data is not an array",
    });
  }

  const cards: LiveSpaceCard[] = [];
  for (const row of data) {
    const mapped = mapOfficialSpaceToCard({ spaceJson: row });
    if (mapped.ok) {
      cards.push(mapped.value);
    }
    // Drop unreadable rows; keep the rest.
  }

  return ok(cards);
}

export async function lookupSpacesById(
  request: LookupSpacesByIdRequest,
  fetchImpl: FetchFn = fetch,
): Promise<Result<readonly LiveSpaceCard[], LiveSpacesError>> {
  if (request.spaceIds.length === 0) {
    return ok([]);
  }

  const chunks = chunkIds(request.spaceIds, LOOKUP_SPACES_BY_ID_CHUNK_SIZE);
  const allCards: LiveSpaceCard[] = [];

  for (const chunk of chunks) {
    const chunkResult = await lookupOneChunk(
      request.bearerToken,
      chunk,
      fetchImpl,
    );
    if (!chunkResult.ok) {
      return chunkResult;
    }
    allCards.push(...chunkResult.value);
  }

  return ok(allCards);
}
