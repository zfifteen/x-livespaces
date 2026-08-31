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

import { err, ok } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export const OFFICIAL_X_API_ORIGIN = "https://api.x.com";

export type OfficialXApiGetRequest = {
  readonly bearerToken: string;
  readonly pathAndQuery: string;
};

type FetchFn = typeof fetch;

function parseRetryAfterSeconds(header: string | null): number | undefined {
  if (header === null || header.trim() === "") {
    return undefined;
  }
  const n = Number(header);
  if (!Number.isInteger(n) || n < 0) {
    return undefined;
  }
  return n;
}

export async function getOfficialXApiJson(
  request: OfficialXApiGetRequest,
  fetchImpl: FetchFn = fetch,
): Promise<Result<unknown, LiveSpacesError>> {
  const bearer = request.bearerToken.trim();
  if (bearer === "") {
    return err({
      kind: "missing-bearer-token",
      message: "X_API_BEARER_TOKEN is required",
    });
  }

  const path = request.pathAndQuery.startsWith("/")
    ? request.pathAndQuery
    : `/${request.pathAndQuery}`;
  const url = `${OFFICIAL_X_API_ORIGIN}/2${path}`;

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearer}`,
      },
    });
  } catch {
    return err({
      kind: "x-api-unavailable",
      httpStatus: undefined,
      message: "Official X API request failed before a response",
    });
  }

  if (response.status === 429) {
    const retryAfterSeconds = parseRetryAfterSeconds(
      response.headers.get("Retry-After"),
    );
    return err({
      kind: "x-api-rate-limited",
      retryAfterSeconds,
      message: "Official X API rate limited",
    });
  }

  if (
    response.status === 401 ||
    response.status === 403 ||
    response.status >= 500
  ) {
    return err({
      kind: "x-api-unavailable",
      httpStatus: response.status,
      message: `Official X API unavailable (HTTP ${response.status})`,
    });
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return err({
      kind: "x-api-payload-unreadable",
      message: "Official X API response was not valid JSON",
    });
  }

  if (!response.ok) {
    return err({
      kind: "x-api-unavailable",
      httpStatus: response.status,
      message: `Official X API returned HTTP ${response.status}`,
    });
  }

  return ok(body);
}
