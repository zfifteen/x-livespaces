import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import { serializeDirectorySnapshot } from "@/lib/http/serialize-directory-snapshot";

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

describe("serializeDirectorySnapshot", () => {
  it("round-trips a snapshot with dates, null language, and coverage", () => {
    const generatedAt = new Date("2026-08-20T12:00:00.000Z");
    const startedAt = new Date("2026-08-20T11:30:00.000Z");
    const snapshot: DirectorySnapshot = {
      generatedAt,
      liveCount: 1,
      appliedFilters: {
        keywordQuery: "news",
        liveOnly: true,
        minimumListenerCount: 5,
        languageCode: undefined,
      },
      visibleCards: [
        card({
          id: "1YpJkwXXDrjJj",
          title: "Morning news",
          listenerCount: 42,
          topicTags: ["news"],
          languageCode: undefined,
          lifecycleState: "live",
          startedAt,
          scheduledStart: undefined,
          joinUrl: "https://x.com/i/spaces/1YpJkwXXDrjJj",
        }),
      ],
      coverage: "official-search",
    };

    const result = serializeDirectorySnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).toEqual({
      generatedAt: "2026-08-20T12:00:00.000Z",
      liveCount: 1,
      appliedFilters: {
        keywordQuery: "news",
        liveOnly: true,
        minimumListenerCount: 5,
        languageCode: null,
      },
      visibleCards: [
        {
          spaceId: "1YpJkwXXDrjJj",
          title: "Morning news",
          listenerCount: 42,
          topicTags: ["news"],
          languageCode: null,
          lifecycleState: "live",
          startedAt: "2026-08-20T11:30:00.000Z",
          scheduledStart: null,
          joinUrl: "https://x.com/i/spaces/1YpJkwXXDrjJj",
          sourceKind: "official-api",
        },
      ],
      coverage: "official-search",
    });
  });

  it("serializes null languageCode and missing optional dates", () => {
    const generatedAt = new Date("2026-08-29T00:00:00.000Z");
    const snapshot: DirectorySnapshot = {
      generatedAt,
      liveCount: 0,
      appliedFilters: DEFAULT_DIRECTORY_FILTERS,
      visibleCards: [
        card({
          id: "1ABCDEFGhij",
          title: "Quiet room",
          listenerCount: 0,
          topicTags: [],
          languageCode: undefined,
          lifecycleState: "scheduled",
          startedAt: undefined,
          scheduledStart: undefined,
        }),
      ],
    };

    const result = serializeDirectorySnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.appliedFilters.languageCode).toBeNull();
    expect(result.value.visibleCards[0]?.languageCode).toBeNull();
    expect(result.value.visibleCards[0]?.startedAt).toBeNull();
    expect(result.value.visibleCards[0]?.scheduledStart).toBeNull();
    expect(result.value.coverage).toBeUndefined();
    expect(result.value.stale).toBeUndefined();
  });

  it("includes coverage cached-after-failure when present", () => {
    const snapshot: DirectorySnapshot = {
      generatedAt: new Date("2026-08-20T12:00:00.000Z"),
      liveCount: 0,
      appliedFilters: DEFAULT_DIRECTORY_FILTERS,
      visibleCards: [],
      coverage: "cached-after-failure",
    };

    const result = serializeDirectorySnapshot(snapshot);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.coverage).toBe("cached-after-failure");
  });
});
