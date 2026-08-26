import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import {
  DEFAULT_DIRECTORY_FILTERS,
  type DirectoryFilters,
} from "@/domain/directory-filters";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { applyDirectoryFilters } from "@/lib/directory/apply-directory-filters";

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

const SAMPLE: readonly LiveSpaceCard[] = [
  card({
    id: "1LIVECRYPTO",
    title: "Crypto Markets Live",
    listenerCount: 120,
    topicTags: ["crypto", "markets"],
    languageCode: "en",
    lifecycleState: "live",
  }),
  card({
    id: "1SCHEDNEWS",
    title: "Morning News Brief",
    listenerCount: 5,
    topicTags: ["news"],
    languageCode: "en",
    lifecycleState: "scheduled",
  }),
  card({
    id: "1LIVEJA",
    title: "日本語スペース",
    listenerCount: 40,
    topicTags: ["japan"],
    languageCode: "ja",
    lifecycleState: "live",
  }),
  card({
    id: "1ENDED",
    title: "Ended Room",
    listenerCount: 200,
    topicTags: ["crypto"],
    languageCode: "en",
    lifecycleState: "ended",
  }),
  card({
    id: "1NOLANG",
    title: "No Language Set",
    listenerCount: 15,
    topicTags: ["general"],
    languageCode: undefined,
    lifecycleState: "live",
  }),
];

describe("applyDirectoryFilters", () => {
  it("returns all cards in original order when filters are permissive", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "",
      liveOnly: false,
      minimumListenerCount: 0,
      languageCode: undefined,
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.map((c) => c.spaceId)).toEqual(
      SAMPLE.map((c) => c.spaceId),
    );
  });

  it("keeps only live cards when liveOnly is true", () => {
    const filters: DirectoryFilters = {
      ...DEFAULT_DIRECTORY_FILTERS,
      liveOnly: true,
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.every((c) => c.lifecycleState === "live")).toBe(true);
    expect(result.map((c) => c.spaceId)).toEqual([
      "1LIVECRYPTO",
      "1LIVEJA",
      "1NOLANG",
    ]);
  });

  it("drops cards below minimumListenerCount (inclusive threshold)", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "",
      liveOnly: false,
      minimumListenerCount: 40,
      languageCode: undefined,
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.map((c) => c.spaceId)).toEqual([
      "1LIVECRYPTO",
      "1LIVEJA",
      "1ENDED",
    ]);
  });

  it("matches languageCode exactly; drops undefined language", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "",
      liveOnly: false,
      minimumListenerCount: 0,
      languageCode: "ja",
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.map((c) => c.spaceId)).toEqual(["1LIVEJA"]);
  });

  it("case-insensitive keyword matches title", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "CRYPTO",
      liveOnly: false,
      minimumListenerCount: 0,
      languageCode: undefined,
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.map((c) => c.spaceId)).toEqual([
      "1LIVECRYPTO",
      "1ENDED",
    ]);
  });

  it("case-insensitive keyword matches topic tags", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "Markets",
      liveOnly: false,
      minimumListenerCount: 0,
      languageCode: undefined,
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.map((c) => c.spaceId)).toEqual(["1LIVECRYPTO"]);
  });

  it("combines liveOnly, min listeners, language, and keyword", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "crypto",
      liveOnly: true,
      minimumListenerCount: 50,
      languageCode: "en",
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result.map((c) => c.spaceId)).toEqual(["1LIVECRYPTO"]);
  });

  it("preserves relative order of matching cards", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "",
      liveOnly: true,
      minimumListenerCount: 0,
      languageCode: undefined,
    };
    const reordered: LiveSpaceCard[] = [SAMPLE[2]!, SAMPLE[0]!, SAMPLE[4]!, SAMPLE[1]!];
    const result = applyDirectoryFilters(reordered, filters);
    expect(result.map((c) => c.spaceId)).toEqual([
      "1LIVEJA",
      "1LIVECRYPTO",
      "1NOLANG",
    ]);
  });

  it("empty keyword after trim is treated as no keyword filter", () => {
    const filters: DirectoryFilters = {
      keywordQuery: "   ",
      liveOnly: false,
      minimumListenerCount: 0,
      languageCode: undefined,
    };
    const result = applyDirectoryFilters(SAMPLE, filters);
    expect(result).toHaveLength(SAMPLE.length);
  });
});
