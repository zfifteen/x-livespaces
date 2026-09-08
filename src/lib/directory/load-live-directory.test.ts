import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import {
  DEFAULT_DIRECTORY_FILTERS,
  type DirectoryFilters,
} from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";
import { err, ok } from "@/domain/result";
import {
  createInMemoryLiveDirectoryCache,
  type LiveDirectoryCache,
} from "@/lib/cache/live-directory-cache";
import {
  loadLiveDirectory,
  type LoadLiveDirectoryRequest,
} from "@/lib/directory/load-live-directory";

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

function snapshot(
  overrides: Partial<DirectorySnapshot> = {},
): DirectorySnapshot {
  const base: DirectorySnapshot = {
    generatedAt: overrides.generatedAt ?? new Date("2026-09-01T12:00:00.000Z"),
    liveCount: overrides.liveCount ?? 2,
    appliedFilters: overrides.appliedFilters ?? DEFAULT_DIRECTORY_FILTERS,
    visibleCards:
      overrides.visibleCards ??
      [
        card({ id: "1AAA", title: "Alpha Live", listenerCount: 50 }),
        card({
          id: "1BBB",
          title: "Beta Quiet",
          listenerCount: 3,
          topicTags: ["quiet"],
        }),
        card({
          id: "1CCC",
          title: "Scheduled Talk",
          listenerCount: 10,
          lifecycleState: "scheduled",
        }),
      ],
  };
  if (overrides.coverage !== undefined) {
    return { ...base, coverage: overrides.coverage };
  }
  return { ...base, coverage: "official-search" };
}

function makeRequest(
  overrides: Partial<LoadLiveDirectoryRequest> = {},
): LoadLiveDirectoryRequest {
  return {
    filters: overrides.filters ?? DEFAULT_DIRECTORY_FILTERS,
    cache: overrides.cache ?? createInMemoryLiveDirectoryCache(),
    now: overrides.now ?? new Date("2026-09-08T12:00:00.000Z"),
  };
}

function failingCache(error: LiveSpacesError): LiveDirectoryCache {
  return {
    readSnapshot: () => Promise.resolve(err(error)),
    writeSnapshot: () => Promise.resolve(ok(undefined)),
  };
}

describe("loadLiveDirectory", () => {
  it("returns defined empty view when cache has no snapshot", async () => {
    const now = new Date("2026-09-08T15:30:00.000Z");
    const filters: DirectoryFilters = {
      keywordQuery: "crypto",
      liveOnly: true,
      minimumListenerCount: 10,
      languageCode: "en",
    };
    const result = await loadLiveDirectory(
      makeRequest({ filters, now }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.generatedAt).toEqual(now);
    expect(result.value.liveCount).toBe(0);
    expect(result.value.appliedFilters).toEqual(filters);
    expect(result.value.visibleCards).toEqual([]);
    expect(result.value.coverage).toBeUndefined();
  });

  it("applies filters to stored cards and preserves unfiltered liveCount and generatedAt", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const stored = snapshot({
      generatedAt: new Date("2026-09-07T10:00:00.000Z"),
      liveCount: 2,
      coverage: "official-search",
      visibleCards: [
        card({ id: "1AAA", title: "Alpha Live", listenerCount: 50 }),
        card({
          id: "1BBB",
          title: "Beta Quiet",
          listenerCount: 3,
          topicTags: ["quiet"],
        }),
        card({
          id: "1CCC",
          title: "Scheduled Talk",
          listenerCount: 10,
          lifecycleState: "scheduled",
        }),
      ],
    });
    await cache.writeSnapshot(stored);

    const filters: DirectoryFilters = {
      keywordQuery: "",
      liveOnly: true,
      minimumListenerCount: 10,
      languageCode: undefined,
    };
    const result = await loadLiveDirectory(
      makeRequest({ cache, filters }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.generatedAt).toEqual(stored.generatedAt);
    expect(result.value.liveCount).toBe(2);
    expect(result.value.appliedFilters).toEqual(filters);
    expect(result.value.coverage).toBe("official-search");
    expect(result.value.visibleCards).toHaveLength(1);
    expect(result.value.visibleCards[0]?.title).toBe("Alpha Live");
  });

  it("preserves coverage cached-after-failure", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const stored = snapshot({
      coverage: "cached-after-failure",
      liveCount: 1,
      visibleCards: [card({ id: "1DDD", title: "Last Good", listenerCount: 20 })],
    });
    await cache.writeSnapshot(stored);

    const result = await loadLiveDirectory(makeRequest({ cache }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.coverage).toBe("cached-after-failure");
    expect(result.value.liveCount).toBe(1);
    expect(result.value.visibleCards).toHaveLength(1);
  });

  it("propagates cache read failures as domain errors", async () => {
    const readError: LiveSpacesError = {
      kind: "x-api-unavailable",
      httpStatus: 500,
      message: "KV read failed",
    };
    const result = await loadLiveDirectory(
      makeRequest({ cache: failingCache(readError) }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toEqual(readError);
  });

  it("never mutates the stored snapshot cards array", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const cards = [
      card({ id: "1EEE", title: "Keep Me", listenerCount: 100 }),
      card({ id: "1FFF", title: "Filter Me Out", listenerCount: 1 }),
    ];
    const stored = snapshot({
      liveCount: 2,
      visibleCards: cards,
    });
    await cache.writeSnapshot(stored);

    const filters: DirectoryFilters = {
      ...DEFAULT_DIRECTORY_FILTERS,
      minimumListenerCount: 50,
    };
    const result = await loadLiveDirectory(makeRequest({ cache, filters }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.visibleCards).toHaveLength(1);

    const reread = await cache.readSnapshot();
    expect(reread.ok).toBe(true);
    if (!reread.ok) return;
    expect(reread.value?.visibleCards).toHaveLength(2);
  });
});
