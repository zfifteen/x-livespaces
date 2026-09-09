/**
 * GET /api/spaces — JSON directory for the UI and public API (TECH_SPEC §8).
 */

import { getLiveSpacesWorkerRuntime } from "@/lib/cloudflare/live-spaces-worker-runtime";
import {
  GET_SPACES_CORS_ORIGIN,
  handleGetSpaces,
} from "@/lib/http/handle-get-spaces";

const DEFAULT_REFRESH_COOLDOWN_SECONDS = 1800;

export async function GET(request: Request): Promise<Response> {
  const runtime = await getLiveSpacesWorkerRuntime();
  return handleGetSpaces(request, {
    cache: runtime.cache,
    now: new Date(),
    refreshCooldownSeconds: DEFAULT_REFRESH_COOLDOWN_SECONDS,
    rateLimiter: runtime.rateLimiter,
  });
}

export function OPTIONS(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": GET_SPACES_CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
