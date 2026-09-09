/**
 * Join counter on the same LIVE_DIRECTORY KV (keys metrics:joins:{day}).
 * Not the OpenNext ISR namespace.
 */

import {
  createInMemoryJoinMetricsStore,
  type JoinMetricsError,
  type JoinMetricsStore,
} from "@/lib/analytics/join-metrics-store";
import { err, ok, type Result } from "@/domain/result";
import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";

function parseCount(raw: string | null): number {
  if (raw === null || raw.trim() === "") {
    return 0;
  }
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}

export function createKvJoinMetricsStore(
  namespace: KvNamespaceLike,
): JoinMetricsStore {
  return {
    incrementJoins: async (
      key: string,
    ): Promise<Result<void, JoinMetricsError>> => {
      try {
        const current = parseCount(await namespace.get(key));
        await namespace.put(key, String(current + 1));
        return ok(undefined);
      } catch {
        return err({
          kind: "join-metrics-unavailable",
          message: "KV join increment failed",
        });
      }
    },
    readJoins: async (
      key: string,
    ): Promise<Result<number, JoinMetricsError>> => {
      try {
        return ok(parseCount(await namespace.get(key)));
      } catch {
        return err({
          kind: "join-metrics-unavailable",
          message: "KV join read failed",
        });
      }
    },
  };
}

export function resolveJoinMetricsStore(
  kv: KvNamespaceLike | undefined,
): JoinMetricsStore {
  if (kv !== undefined) {
    return createKvJoinMetricsStore(kv);
  }
  return createInMemoryJoinMetricsStore();
}
