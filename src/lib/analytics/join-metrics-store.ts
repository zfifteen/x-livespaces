/**
 * MVP join counter: KV key `metrics:joins:{yyyy-mm-dd}` (UTC).
 * Space id is accepted on the beacon but not stored — day bucket only.
 */

import { err, ok, type Result } from "@/domain/result";

export type JoinMetricsError = {
  readonly kind: "join-metrics-unavailable";
  readonly message: string;
};

export type JoinMetricsStore = {
  readonly incrementJoins: (
    key: string,
  ) => Promise<Result<void, JoinMetricsError>>;
  readonly readJoins: (
    key: string,
  ) => Promise<Result<number, JoinMetricsError>>;
};

export function joinMetricsKeyForDay(now: Date): string {
  return `metrics:joins:${now.toISOString().slice(0, 10)}`;
}

export function createInMemoryJoinMetricsStore(): JoinMetricsStore {
  const counts = new Map<string, number>();
  return {
    incrementJoins: async (key: string): Promise<Result<void, JoinMetricsError>> => {
      await Promise.resolve();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      return ok(undefined);
    },
    readJoins: async (key: string): Promise<Result<number, JoinMetricsError>> => {
      await Promise.resolve();
      return ok(counts.get(key) ?? 0);
    },
  };
}

export function unavailableJoinMetricsStore(
  message: string,
): JoinMetricsStore {
  return {
    incrementJoins: () =>
      Promise.resolve(err({ kind: "join-metrics-unavailable", message })),
    readJoins: () =>
      Promise.resolve(err({ kind: "join-metrics-unavailable", message })),
  };
}
