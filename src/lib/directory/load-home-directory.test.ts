import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { createInMemoryLiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { loadHomeDirectorySnapshot } from "@/lib/directory/load-home-directory";

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

describe("loadHomeDirectorySnapshot", () => {
  it("returns the cached snapshot with query filters applied and never writes the cache", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const stored: DirectorySnapshot = {
      generatedAt: new Date("2026-09-09T12:00:00.000Z"),
      liveCount: 1,
      appliedFilters: DEFAULT_DIRECTORY_FILTERS,
      visibleCards: [card({ id: "1AAA", title: "Alpha Live", listenerCount: 4 })],
      coverage: "official-search",
    };
    await cache.writeSnapshot(stored);

    const view = await loadHomeDirectorySnapshot(
      new URLSearchParams("q=Alpha"),
      { cache, now: new Date("2026-09-09T12:05:00.000Z") },
    );

    expect(view?.visibleCards.map((c) => c.title)).toEqual(["Alpha Live"]);
    expect(view?.liveCount).toBe(1);
    expect(view?.generatedAt.toISOString()).toBe("2026-09-09T12:00:00.000Z");
    const reread = await cache.readSnapshot();
    expect(reread.ok && reread.value?.generatedAt.toISOString()).toBe(
      "2026-09-09T12:00:00.000Z",
    );
  });

  it("returns an empty defined view when the cache is cold", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const now = new Date("2026-09-09T12:00:00.000Z");
    const view = await loadHomeDirectorySnapshot(new URLSearchParams(), {
      cache,
      now,
    });
    expect(view?.liveCount).toBe(0);
    expect(view?.visibleCards).toEqual([]);
    expect(view?.generatedAt).toBe(now);
  });
});
