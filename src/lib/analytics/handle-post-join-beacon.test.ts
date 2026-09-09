import { describe, expect, it } from "vitest";
import { err, ok } from "@/domain/result";
import {
  createInMemoryJoinMetricsStore,
  joinMetricsKeyForDay,
} from "@/lib/analytics/join-metrics-store";
import { handlePostJoinBeacon } from "@/lib/analytics/handle-post-join-beacon";

describe("joinMetricsKeyForDay", () => {
  it("uses UTC yyyy-mm-dd", () => {
    expect(joinMetricsKeyForDay(new Date("2026-09-09T23:30:00.000Z"))).toBe(
      "metrics:joins:2026-09-09",
    );
  });
});

describe("createInMemoryJoinMetricsStore", () => {
  it("increments the day bucket", async () => {
    const store = createInMemoryJoinMetricsStore();
    await store.incrementJoins("metrics:joins:2026-09-09");
    await store.incrementJoins("metrics:joins:2026-09-09");
    const count = await store.readJoins("metrics:joins:2026-09-09");
    expect(count.ok && count.value).toBe(2);
  });
});

describe("handlePostJoinBeacon", () => {
  it("increments the UTC day bucket for a valid spaceId", async () => {
    const store = createInMemoryJoinMetricsStore();
    const response = await handlePostJoinBeacon(
      new Request("https://livespaces.example/api/analytics/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId: "1YpJkwXXDrjJj" }),
      }),
      { store, now: new Date("2026-09-09T01:02:03.000Z") },
    );
    expect(response.status).toBe(204);
    const count = await store.readJoins("metrics:joins:2026-09-09");
    expect(count.ok && count.value).toBe(1);
  });

  it("still returns 204 when the store fails", async () => {
    const response = await handlePostJoinBeacon(
      new Request("https://livespaces.example/api/analytics/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ spaceId: "1YpJkwXXDrjJj" }),
      }),
      {
        store: {
          incrementJoins: () =>
            Promise.resolve(
              err({
                kind: "join-metrics-unavailable",
                message: "kv down",
              }),
            ),
          readJoins: () => Promise.resolve(ok(0)),
        },
        now: new Date("2026-09-09T01:02:03.000Z"),
      },
    );
    expect(response.status).toBe(204);
  });
});
