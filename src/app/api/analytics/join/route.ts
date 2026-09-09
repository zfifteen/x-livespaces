/**
 * POST /api/analytics/join — first-party Join beacon (TECH_SPEC §12).
 */

import { handlePostJoinBeacon } from "@/lib/analytics/handle-post-join-beacon";
import { getSharedJoinMetricsStore } from "@/lib/analytics/shared-join-metrics-store";

export async function POST(request: Request): Promise<Response> {
  return handlePostJoinBeacon(request, {
    store: getSharedJoinMetricsStore(),
    now: new Date(),
  });
}
