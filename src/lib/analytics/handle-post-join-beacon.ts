/**
 * POST /api/analytics/join — increment the UTC day join counter.
 * Always 204: beacons are fire-and-forget; store failures stay silent.
 */

import { spaceIdFromString } from "@/domain/branded-ids";
import {
  joinMetricsKeyForDay,
  type JoinMetricsStore,
} from "@/lib/analytics/join-metrics-store";

export type HandlePostJoinBeaconDeps = {
  readonly store: JoinMetricsStore;
  readonly now: Date;
};

async function spaceIdFromRequest(request: Request): Promise<string | undefined> {
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return undefined;
    }
    const raw = (parsed as Record<string, unknown>)["spaceId"];
    return typeof raw === "string" ? raw : undefined;
  } catch {
    return undefined;
  }
}

export async function handlePostJoinBeacon(
  request: Request,
  deps: HandlePostJoinBeaconDeps,
): Promise<Response> {
  const rawId = await spaceIdFromRequest(request);
  if (rawId !== undefined) {
    const parsed = spaceIdFromString(rawId);
    if (parsed.ok) {
      const key = joinMetricsKeyForDay(deps.now);
      const write = await deps.store.incrementJoins(key);
      if (!write.ok) {
        console.info("join metrics unavailable", write.error.kind);
      }
    }
  }
  return new Response(null, { status: 204 });
}
