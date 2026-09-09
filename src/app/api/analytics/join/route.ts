/**
 * POST /api/analytics/join — first-party Join beacon (TECH_SPEC §12).
 */

import { handlePostJoinBeacon } from "@/lib/analytics/handle-post-join-beacon";
import { getLiveSpacesWorkerRuntime } from "@/lib/cloudflare/live-spaces-worker-runtime";

export async function POST(request: Request): Promise<Response> {
  const runtime = await getLiveSpacesWorkerRuntime();
  return handlePostJoinBeacon(request, {
    store: runtime.joinStore,
    now: new Date(),
  });
}
