import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { err, ok } from "@/domain/result";
import { createInMemoryLiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { handlePostSpacesRefresh } from "@/lib/http/handle-post-spaces-refresh";
import type { LiveSpacesEnvironment } from "@/lib/env/read-live-spaces-environment";
import type { SearchSpacesByKeywordFn } from "@/lib/refresh/refresh-live-directory";

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

const env: LiveSpacesEnvironment = {
  xApiBearerToken: "test-bearer",
  refreshCooldownSeconds: 1800,
};

describe("handlePostSpacesRefresh", () => {
  it("skips X and returns refreshed false when the snapshot is still fresh", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const prior: DirectorySnapshot = {
      generatedAt: new Date("2026-09-09T12:00:00.000Z"),
      liveCount: 1,
      appliedFilters: DEFAULT_DIRECTORY_FILTERS,
      visibleCards: [card({ id: "1AAA", title: "Prior" })],
      coverage: "official-search",
    };
    await cache.writeSnapshot(prior);
    let searchCalls = 0;
    const searchSpacesByKeyword: SearchSpacesByKeywordFn = () => {
      searchCalls += 1;
      return Promise.resolve(ok([]));
    };

    const response = await handlePostSpacesRefresh(
      new Request("https://livespaces.example/api/spaces/refresh", {
        method: "POST",
      }),
      {
        cache,
        now: new Date("2026-09-09T12:10:00.000Z"),
        readEnvironment: () => ok(env),
        searchSpacesByKeyword,
      },
    );

    expect(response.status).toBe(200);
    expect(searchCalls).toBe(0);
    const body = (await response.json()) as { refreshed: boolean; liveCount: number };
    expect(body.refreshed).toBe(false);
    expect(body.liveCount).toBe(1);
  });

  it("calls injected search on a cold cache and writes coverage official-search", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const searchSpacesByKeyword: SearchSpacesByKeywordFn = () =>
      Promise.resolve(
        ok([card({ id: "1ZZZ", title: "Fresh Room", listenerCount: 9 })]),
      );

    const response = await handlePostSpacesRefresh(
      new Request("https://livespaces.example/api/spaces/refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ q: "news" }),
      }),
      {
        cache,
        now: new Date("2026-09-09T12:00:00.000Z"),
        readEnvironment: () => ok(env),
        searchSpacesByKeyword,
      },
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      refreshed: boolean;
      coverage: string;
      liveCount: number;
    };
    expect(body.refreshed).toBe(true);
    expect(body.coverage).toBe("official-search");
    expect(body.liveCount).toBe(1);
  });

  it("maps missing bearer to HTTP 500 without calling search", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    let searchCalls = 0;
    const response = await handlePostSpacesRefresh(
      new Request("https://livespaces.example/api/spaces/refresh", {
        method: "POST",
      }),
      {
        cache,
        now: new Date("2026-09-09T12:00:00.000Z"),
        readEnvironment: () =>
          err({
            kind: "missing-bearer-token",
            message: "X_API_BEARER_TOKEN is required",
          }),
        searchSpacesByKeyword: () => {
          searchCalls += 1;
          return Promise.resolve(ok([]));
        },
      },
    );
    expect(response.status).toBe(500);
    expect(searchCalls).toBe(0);
  });
});
