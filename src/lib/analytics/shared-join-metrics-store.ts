/**
 * Shared join counter: KV when LIVE_DIRECTORY is bound, else in-memory.
 */

import type { JoinMetricsStore } from "@/lib/analytics/join-metrics-store";
import { resolveJoinMetricsStore } from "@/lib/analytics/kv-join-metrics-store";
import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";

let sharedJoinMetricsStore: JoinMetricsStore | undefined;

export function getSharedJoinMetricsStore(
  kv?: KvNamespaceLike,
): JoinMetricsStore {
  if (sharedJoinMetricsStore === undefined) {
    sharedJoinMetricsStore = resolveJoinMetricsStore(kv);
  }
  return sharedJoinMetricsStore;
}
