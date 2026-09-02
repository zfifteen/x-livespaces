/**
 * Official live/scheduled Space search.
 *
 * Endpoint: GET /2/spaces/search
 * Required query parameter: `query` (keyword). There is no unfiltered
 * "every live Space" call; the directory fan-out layer supplies keywords.
 *
 * Intended logic (MVP — no User expansions):
 * 1. Reject empty keywords (caller should use fan-out).
 * 2. Request `state=live` (or scheduled when filters.liveOnly is false).
 * 3. Ask for space.fields: title, participant_count, started_at,
 *    scheduled_start, lang, state.
 * 4. Do not request expansions or user.fields.
 * 5. Map each payload row through `mapOfficialSpaceToCard`.
 * 6. Drop rows that fail mapping; collect mapping errors for logs, keep the rest.
 */

import type { LiveSpacesError } from "@/domain/errors";
import type { LiveSpaceCard, SpaceLifecycleState } from "@/domain/live-space-card";
import { err, ok, type Result } from "@/domain/result";
import { getOfficialXApiJson } from "@/lib/x-api/official-x-api-client";
import { mapOfficialSpaceToCard } from "@/lib/x-api/map-official-space-to-card";

export type SearchSpacesByKeywordRequest = {
  readonly bearerToken: string;
  readonly keywordQuery: string;
  readonly state: SpaceLifecycleState;
};

const SPACE_FIELDS =
  "title,participant_count,started_at,scheduled_start,lang,state";

type FetchFn = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Build the path+query for GET /2/spaces/search.
 * Encodes the keyword; never requests expansions or user.fields.
 */
export function buildSpacesSearchPathAndQuery(
  keywordQuery: string,
  state: SpaceLifecycleState,
): string {
  const params = new URLSearchParams();
  params.set("query", keywordQuery);
  params.set("state", state);
  params.set("space.fields", SPACE_FIELDS);
  return `/spaces/search?${params.toString()}`;
}

export async function searchSpacesByKeyword(
  request: SearchSpacesByKeywordRequest,
  fetchImpl: FetchFn = fetch,
): Promise<Result<readonly LiveSpaceCard[], LiveSpacesError>> {
  const keyword = request.keywordQuery.trim();
  if (keyword === "") {
    return err({
      kind: "invalid-filters",
      message: "searchSpacesByKeyword requires a non-empty keywordQuery",
    });
  }

  const pathAndQuery = buildSpacesSearchPathAndQuery(keyword, request.state);

  const jsonResult = await getOfficialXApiJson(
    {
      bearerToken: request.bearerToken,
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
      message: "Official Spaces search response is not an object",
    });
  }

  const data = body["data"];
  // Official API omits `data` when zero matches; treat as empty success.
  if (data === undefined || data === null) {
    return ok([]);
  }

  if (!Array.isArray(data)) {
    return err({
      kind: "x-api-payload-unreadable",
      message: "Official Spaces search data is not an array",
    });
  }

  const cards: LiveSpaceCard[] = [];
  for (const row of data) {
    const mapped = mapOfficialSpaceToCard({ spaceJson: row });
    if (mapped.ok) {
      cards.push(mapped.value);
    }
    // Drop unreadable rows; keep the rest (TECH_SPEC §7).
  }

  return ok(cards);
}
