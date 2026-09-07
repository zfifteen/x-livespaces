import { describe, expect, it, vi } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { createInMemoryLiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import type { LiveSpacesEnvironment } from "@/lib/env/read-live-spaces-environment";
import {
  refreshLiveDirectory,
  type RefreshLiveDirectoryRequest,
  type SearchSpacesByKeywordFn,
} from "@/lib/refresh/refresh-live-directory";
import type { SearchSpacesByKeywordRequest } from "@/lib/x-api/search-spaces-by-keyword";
import { ok, err } from "@/domain/result";

function card(id: string, title: string, listeners = 10): LiveSpaceCard {
  const idResult = spaceIdFromString(id);
  if (!idResult.ok) {
    throw new Error(`bad test id: ${id}`);
  }
  return {
    spaceId: idResult.value,
    title,
    listenerCount: listeners,
    topicTags: [],
    languageCode: "en",
    lifecycleState: "live",
    startedAt: new Date("2026-09-01T12:00:00.000Z"),
    scheduledStart: undefined,
    joinUrl: `https://x.com/i/spaces/${id}`,
    sourceKind: "official-api",
  };
}

function snapshot(overrides: Partial<DirectorySnapshot> = {}): DirectorySnapshot {
  const base: DirectorySnapshot = {
    generatedAt: overrides.generatedAt ?? new Date("2026-09-01T12:00:00.000Z"),
    liveCount: overrides.liveCount ?? 1,
    appliedFilters: overrides.appliedFilters ?? DEFAULT_DIRECTORY_FILTERS,
    visibleCards: overrides.visibleCards ?? [card("1AAA", "Alpha")],
  };
  if (overrides.coverage !== undefined) {
    return { ...base, coverage: overrides.coverage };
  }
  return { ...base, coverage: "official-search" };
}

const ENV: LiveSpacesEnvironment = {
  xApiBearerToken: "test-bearer",
  refreshCooldownSeconds: 1800,
};

function makeRequest(
  overrides: Partial<RefreshLiveDirectoryRequest> = {},
): RefreshLiveDirectoryRequest {
  const cache = overrides.cache ?? createInMemoryLiveDirectoryCache();
  return {
    cache,
    now: overrides.now ?? new Date("2026-09-05T12:00:00.000Z"),
    extraKeywords: overrides.extraKeywords ?? [],
    readEnvironment: overrides.readEnvironment ?? (() => ok(ENV)),
    searchSpacesByKeyword:
      overrides.searchSpacesByKeyword ??
      (() => Promise.resolve(ok([] as readonly LiveSpaceCard[]))),
  };
}

describe("refreshLiveDirectory", () => {
  it("returns existing snapshot with refreshed:false when still fresh; zero search calls", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const prior = snapshot({
      generatedAt: new Date("2026-09-05T11:45:00.000Z"), // 15 min ago
      liveCount: 2,
      visibleCards: [card("1AAA", "Alpha"), card("1BBB", "Beta")],
    });
    await cache.writeSnapshot(prior);

    const searchMock = vi.fn<SearchSpacesByKeywordFn>(() =>
      Promise.resolve(ok([] as readonly LiveSpaceCard[])),
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now: new Date("2026-09-05T12:00:00.000Z"),
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(false);
    expect(result.value.snapshot).toEqual(prior);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("on missing snapshot, fans out vowels, merges, writes official-search, returns refreshed:true", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const now = new Date("2026-09-05T12:00:00.000Z");

    const searchMock = vi.fn<SearchSpacesByKeywordFn>(
      (req: SearchSpacesByKeywordRequest) => {
        if (req.keywordQuery === "a") {
          return Promise.resolve(ok([card("1AAA", "From A", 50)]));
        }
        if (req.keywordQuery === "e") {
          return Promise.resolve(
            ok([card("1EEE", "From E", 20), card("1AAA", "From A again", 50)]),
          );
        }
        return Promise.resolve(ok([] as readonly LiveSpaceCard[]));
      },
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now,
        extraKeywords: [],
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(true);
    const snap = result.value.snapshot;
    expect(snap.generatedAt).toEqual(now);
    expect(snap.coverage).toBe("official-search");
    expect(snap.appliedFilters).toEqual(DEFAULT_DIRECTORY_FILTERS);
    // union by id, live first then listeners desc
    expect(snap.visibleCards.map((c) => c.spaceId)).toEqual(["1AAA", "1EEE"]);
    expect(snap.liveCount).toBe(2);

    // five vowels
    expect(searchMock).toHaveBeenCalledTimes(5);
    const keywords = searchMock.mock.calls.map((c) => c[0].keywordQuery);
    expect(keywords).toEqual(["a", "e", "i", "o", "u"]);

    // written
    const readBack = await cache.readSnapshot();
    expect(readBack.ok).toBe(true);
    if (!readBack.ok) return;
    expect(readBack.value).toEqual(snap);
  });

  it("on stale snapshot, refreshes without extraKeywords; writes new snapshot", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const prior = snapshot({
      generatedAt: new Date("2026-09-05T11:00:00.000Z"), // 60 min ago
      liveCount: 1,
      visibleCards: [card("1OLD", "Old")],
    });
    await cache.writeSnapshot(prior);

    const now = new Date("2026-09-05T12:00:00.000Z");
    const searchMock = vi.fn<SearchSpacesByKeywordFn>(() =>
      Promise.resolve(ok([card("1NEW", "New", 99)])),
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now,
        extraKeywords: ["visitor-q"],
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(true);
    expect(result.value.snapshot.visibleCards[0]!.spaceId).toBe("1NEW");
    expect(result.value.snapshot.coverage).toBe("official-search");

    // extraKeywords ignored because not cold
    const keywords = searchMock.mock.calls.map((c) => c[0].keywordQuery);
    expect(keywords).toEqual(["a", "e", "i", "o", "u"]);
    expect(keywords).not.toContain("visitor-q");
  });

  it("on cold cache, prepends extraKeywords before vowels", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const now = new Date("2026-09-05T12:00:00.000Z");

    const searchMock = vi.fn<SearchSpacesByKeywordFn>(() =>
      Promise.resolve(ok([] as readonly LiveSpaceCard[])),
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now,
        extraKeywords: ["  Crypto  ", "a"], // a will dedupe
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(true);

    const keywords = searchMock.mock.calls.map((c) => c[0].keywordQuery);
    expect(keywords).toEqual(["Crypto", "a", "e", "i", "o", "u"]);
  });

  it("propagates missing-bearer-token from environment", async () => {
    const result = await refreshLiveDirectory(
      makeRequest({
        readEnvironment: () =>
          err({
            kind: "missing-bearer-token",
            message: "X_API_BEARER_TOKEN is required",
          }),
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.kind).toBe("missing-bearer-token");
  });

  it("passes bearer and state=live to each search", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const searchMock = vi.fn<SearchSpacesByKeywordFn>(() =>
      Promise.resolve(ok([] as readonly LiveSpaceCard[])),
    );

    await refreshLiveDirectory(
      makeRequest({
        cache,
        searchSpacesByKeyword: searchMock,
      }),
    );

    for (const call of searchMock.mock.calls) {
      const req = call[0];
      expect(req.bearerToken).toBe("test-bearer");
      expect(req.state).toBe("live");
    }
  });

  it("on total X failure with prior snapshot: leaves store unchanged, returns cached-after-failure", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const prior = snapshot({
      generatedAt: new Date("2026-09-05T11:00:00.000Z"), // stale
      liveCount: 1,
      visibleCards: [card("1OLD", "Old")],
      coverage: "official-search",
    });
    await cache.writeSnapshot(prior);

    const searchMock = vi.fn<SearchSpacesByKeywordFn>(() =>
      Promise.resolve(
        err({
          kind: "x-api-unavailable",
          httpStatus: 503,
          message: "X unavailable",
        }),
      ),
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now: new Date("2026-09-05T12:00:00.000Z"),
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(true);
    expect(result.value.snapshot.coverage).toBe("cached-after-failure");
    expect(result.value.snapshot.visibleCards).toEqual(prior.visibleCards);
    expect(result.value.snapshot.generatedAt).toEqual(prior.generatedAt);
    expect(result.value.snapshot.liveCount).toBe(prior.liveCount);

    // Stored snapshot unchanged (still official-search, original generatedAt).
    const readBack = await cache.readSnapshot();
    expect(readBack.ok).toBe(true);
    if (!readBack.ok) return;
    expect(readBack.value).toEqual(prior);
    expect(searchMock).toHaveBeenCalledTimes(5);
  });

  it("on total X failure with empty cache: writes empty official-search snapshot", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const now = new Date("2026-09-05T12:00:00.000Z");

    const searchMock = vi.fn<SearchSpacesByKeywordFn>(() =>
      Promise.resolve(
        err({
          kind: "x-api-unavailable",
          httpStatus: 503,
          message: "X unavailable",
        }),
      ),
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now,
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(true);
    const snap = result.value.snapshot;
    expect(snap.generatedAt).toEqual(now);
    expect(snap.liveCount).toBe(0);
    expect(snap.visibleCards).toEqual([]);
    expect(snap.coverage).toBe("official-search");
    expect(snap.appliedFilters).toEqual(DEFAULT_DIRECTORY_FILTERS);

    const readBack = await cache.readSnapshot();
    expect(readBack.ok).toBe(true);
    if (!readBack.ok) return;
    expect(readBack.value).toEqual(snap);
  });

  it("on partial success: merges successful batches and writes official-search", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const prior = snapshot({
      generatedAt: new Date("2026-09-05T11:00:00.000Z"),
      liveCount: 1,
      visibleCards: [card("1OLD", "Old")],
    });
    await cache.writeSnapshot(prior);

    const now = new Date("2026-09-05T12:00:00.000Z");
    const searchMock = vi.fn<SearchSpacesByKeywordFn>(
      (req: SearchSpacesByKeywordRequest) => {
        if (req.keywordQuery === "a") {
          return Promise.resolve(ok([card("1AAA", "From A", 50)]));
        }
        if (req.keywordQuery === "e") {
          return Promise.resolve(
            err({
              kind: "x-api-rate-limited",
              retryAfterSeconds: 60,
              message: "rate limited",
            }),
          );
        }
        // other vowels succeed empty
        return Promise.resolve(ok([] as readonly LiveSpaceCard[]));
      },
    );

    const result = await refreshLiveDirectory(
      makeRequest({
        cache,
        now,
        searchSpacesByKeyword: searchMock,
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.refreshed).toBe(true);
    const snap = result.value.snapshot;
    expect(snap.coverage).toBe("official-search");
    expect(snap.generatedAt).toEqual(now);
    expect(snap.visibleCards.map((c) => c.spaceId)).toEqual(["1AAA"]);
    expect(snap.liveCount).toBe(1);

    const readBack = await cache.readSnapshot();
    expect(readBack.ok).toBe(true);
    if (!readBack.ok) return;
    expect(readBack.value).toEqual(snap);
  });
});
