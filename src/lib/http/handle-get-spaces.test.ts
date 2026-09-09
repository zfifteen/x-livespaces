import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { createInMemoryLiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { handleGetSpaces } from "@/lib/http/handle-get-spaces";

function card(
  overrides: Partial<LiveSpaceCard> & { id: string },
): LiveSpaceCard {
  const idResult = spaceIdFromString(overrides.id);
  if (!idResult.ok) {
    throw new Error(`bad test id: ${overrides.id}`);
  }
  return {
    spaceId: idResult.value,
    title: overrides.title ?? "Untitled",
    listenerCount: overrides.listenerCount ?? 0,
    topicTags: overrides.topicTags ?? [],
    languageCode: overrides.languageCode,
    lifecycleState: overrides.lifecycleState ?? "live",
    startedAt: overrides.startedAt,
    scheduledStart: overrides.scheduledStart,
    joinUrl: overrides.joinUrl ?? `https://x.com/i/spaces/${overrides.id}`,
    sourceKind: overrides.sourceKind ?? "official-api",
  };
}

function storedSnapshot(): DirectorySnapshot {
  return {
    generatedAt: new Date("2026-09-09T12:00:00.000Z"),
    liveCount: 2,
    appliedFilters: DEFAULT_DIRECTORY_FILTERS,
    visibleCards: [
      card({
        id: "1AAA",
        title: "Alpha Live",
        listenerCount: 50,
        languageCode: "en",
      }),
      card({
        id: "1BBB",
        title: "Beta Quiet",
        listenerCount: 3,
        languageCode: "en",
      }),
      card({
        id: "1CCC",
        title: "Scheduled Talk",
        listenerCount: 10,
        lifecycleState: "scheduled",
      }),
    ],
    coverage: "official-search",
  };
}

describe("handleGetSpaces", () => {
  it("returns 200 JSON with CORS, coverage, and stale false when the snapshot is fresh", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    await cache.writeSnapshot(storedSnapshot());
    const now = new Date("2026-09-09T12:10:00.000Z");

    const response = await handleGetSpaces(
      new Request("https://livespaces.example/api/spaces"),
      { cache, now, refreshCooldownSeconds: 1800 },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const body = (await response.json()) as Record<string, unknown>;
    expect(body["coverage"]).toBe("official-search");
    expect(body["stale"]).toBe(false);
    expect(body["liveCount"]).toBe(2);
    expect(Array.isArray(body["visibleCards"])).toBe(true);
  });

  it("applies keyword, live, minListeners, and lang filters from the query string", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    await cache.writeSnapshot(storedSnapshot());
    const now = new Date("2026-09-09T12:10:00.000Z");

    const response = await handleGetSpaces(
      new Request(
        "https://livespaces.example/api/spaces?q=Alpha&live=1&minListeners=10&lang=en",
      ),
      { cache, now, refreshCooldownSeconds: 1800 },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      visibleCards: { title: string }[];
      appliedFilters: {
        keywordQuery: string;
        liveOnly: boolean;
        minimumListenerCount: number;
        languageCode: string | null;
      };
    };
    expect(body.appliedFilters).toEqual({
      keywordQuery: "Alpha",
      liveOnly: true,
      minimumListenerCount: 10,
      languageCode: "en",
    });
    expect(body.visibleCards.map((c) => c.title)).toEqual(["Alpha Live"]);
  });

  it("marks stale true when generatedAt is outside the cooldown window", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    await cache.writeSnapshot(storedSnapshot());
    const now = new Date("2026-09-09T13:00:00.000Z");

    const response = await handleGetSpaces(
      new Request("https://livespaces.example/api/spaces"),
      { cache, now, refreshCooldownSeconds: 1800 },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as { stale: boolean };
    expect(body.stale).toBe(true);
  });

  it("returns 400 for invalid minListeners without calling X", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const response = await handleGetSpaces(
      new Request("https://livespaces.example/api/spaces?minListeners=-1"),
      {
        cache,
        now: new Date("2026-09-09T12:00:00.000Z"),
        refreshCooldownSeconds: 1800,
      },
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    const body = (await response.json()) as { kind: string };
    expect(body.kind).toBe("invalid-filters");
  });

  it("returns a defined empty 200 view when the cache is cold", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const now = new Date("2026-09-09T12:00:00.000Z");
    const response = await handleGetSpaces(
      new Request("https://livespaces.example/api/spaces"),
      { cache, now, refreshCooldownSeconds: 1800 },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      liveCount: number;
      visibleCards: unknown[];
      stale: boolean;
    };
    expect(body.liveCount).toBe(0);
    expect(body.visibleCards).toEqual([]);
    expect(body.stale).toBe(false);
  });
});
