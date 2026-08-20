/**
 * POST /api/internal/refresh — cron entrypoint for directory rebuild.
 *
 * Intended logic:
 * 1. Compare `Authorization: Bearer` to `CRON_SECRET`. Mismatch or empty
 *    secret → `unauthorized-refresh`.
 * 2. Call `refreshLiveDirectory` with the shared cache.
 * 3. Return `{ liveCount, generatedAt }` on success.
 */

import { notImplementedYet } from "@/domain/result";
import { liveSpacesErrorToHttp } from "@/lib/http/live-spaces-error-to-http";

export function POST(request: Request): Response {
  void request;
  const result = notImplementedYet("POST /api/internal/refresh");
  if (!result.ok) {
    const http = liveSpacesErrorToHttp(result.error);
    return Response.json(http, { status: http.status });
  }
  return Response.json(result.value);
}
