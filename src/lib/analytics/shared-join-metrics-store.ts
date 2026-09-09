/**
 * Process-local join counter. KV adapter lands in S26.
 */

import {
  createInMemoryJoinMetricsStore,
  type JoinMetricsStore,
} from "@/lib/analytics/join-metrics-store";

let sharedJoinMetricsStore: JoinMetricsStore | undefined;

export function getSharedJoinMetricsStore(): JoinMetricsStore {
  if (sharedJoinMetricsStore === undefined) {
    sharedJoinMetricsStore = createInMemoryJoinMetricsStore();
  }
  return sharedJoinMetricsStore;
}
