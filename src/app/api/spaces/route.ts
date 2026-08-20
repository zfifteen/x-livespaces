/**
 * GET /api/spaces — JSON directory for the UI and future public API.
 *
 * Intended logic:
 * 1. Parse request URL search params into `DirectoryFilters`.
 * 2. `loadLiveDirectory` with the shared cache and `new Date()`.
 * 3. Serialize snapshot (Dates as ISO strings).
 * 4. Map domain errors through `liveSpacesErrorToHttp`.
 *
 * Phase 1 always returns 501 from the not-implemented load path once wired.
 * Until then, return 501 explicitly so clients have a stable contract.
 */

import { notImplementedYet } from "@/domain/result";
import { liveSpacesErrorToHttp } from "@/lib/http/live-spaces-error-to-http";

export function GET(request: Request): Response {
  void request;
  const result = notImplementedYet("GET /api/spaces");
  if (!result.ok) {
    const http = liveSpacesErrorToHttp(result.error);
    return Response.json(http, { status: http.status });
  }
  return Response.json(result.value);
}
