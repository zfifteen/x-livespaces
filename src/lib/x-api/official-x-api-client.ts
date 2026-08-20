/**
 * Thin authenticated GET client for api.x.com v2.
 *
 * All official Spaces traffic should go through `getOfficialXApiJson` so
 * rate-limit headers, bearer handling, and error mapping stay in one place.
 *
 * Intended logic:
 * 1. Require a non-empty bearer token (`missing-bearer-token` otherwise).
 * 2. GET `https://api.x.com/2` + pathAndQuery with `Authorization: Bearer`.
 * 3. Map HTTP 429 → `x-api-rate-limited` using `Retry-After` when present.
 * 4. Map HTTP 401/403/5xx → `x-api-unavailable` with status.
 * 5. Parse JSON as `unknown`; callers run type guards. JSON parse failure →
 *    `x-api-payload-unreadable`.
 *
 * Do not log the bearer token. Stay inside X Developer terms: no private-data scrape.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export const OFFICIAL_X_API_ORIGIN = "https://api.x.com";

export type OfficialXApiGetRequest = {
  readonly bearerToken: string;
  readonly pathAndQuery: string;
};

export function getOfficialXApiJson(
  request: OfficialXApiGetRequest,
): Promise<Result<unknown, LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("getOfficialXApiJson"));
}
