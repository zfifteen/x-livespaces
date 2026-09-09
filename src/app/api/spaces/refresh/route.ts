/**
 * POST /api/spaces/refresh — only writer that may call X (TECH_SPEC §7).
 */

import { getSharedLiveDirectoryCache } from "@/lib/cache/shared-live-directory-cache";
import { handlePostSpacesRefresh } from "@/lib/http/handle-post-spaces-refresh";
import { readLiveSpacesEnvironment } from "@/lib/env/read-live-spaces-environment";
import { searchSpacesByKeyword } from "@/lib/x-api/search-spaces-by-keyword";

export async function POST(request: Request): Promise<Response> {
  return handlePostSpacesRefresh(request, {
    cache: getSharedLiveDirectoryCache(),
    now: new Date(),
    readEnvironment: () => readLiveSpacesEnvironment(),
    searchSpacesByKeyword,
  });
}
