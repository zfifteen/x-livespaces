import { describe, expect, it } from "vitest";
import { createFakeKvNamespace } from "@/lib/cache/fake-kv-namespace";
import { createKvJoinMetricsStore } from "@/lib/analytics/kv-join-metrics-store";

describe("createKvJoinMetricsStore", () => {
  it("increments metrics:joins:{day} on fake KV", async () => {
    const kv = createFakeKvNamespace();
    const store = createKvJoinMetricsStore(kv);
    const key = "metrics:joins:2026-09-09";
    await store.incrementJoins(key);
    await store.incrementJoins(key);
    const count = await store.readJoins(key);
    expect(count.ok && count.value).toBe(2);
    expect(kv.puts.some((put) => put.key === key && put.expirationTtl === undefined)).toBe(
      true,
    );
  });
});
