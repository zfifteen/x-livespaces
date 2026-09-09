/**
 * POST /api/spaces/refresh — only writer that may call X (TECH_SPEC §7).
 * Missing bearer → 500; GET reads still serve last KV.
 */

import { getLiveSpacesWorkerRuntime } from "@/lib/cloudflare/live-spaces-worker-runtime";
import { handlePostSpacesRefresh } from "@/lib/http/handle-post-spaces-refresh";
import { readLiveSpacesEnvironment } from "@/lib/env/read-live-spaces-environment";
import { searchSpacesByKeyword } from "@/lib/x-api/search-spaces-by-keyword";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getLiveSpacesWorkerRuntime();
  return handlePostSpacesRefresh(request, {
    cache: runtime.cache,
    now: new Date(),
    readEnvironment: () => readLiveSpacesEnvironment(),
    searchSpacesByKeyword,
  });
}
