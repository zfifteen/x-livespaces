import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import {
  createInMemoryLiveDirectoryCache,
  snapshotIsFresh,
} from "@/lib/cache/live-directory-cache";

function card(id: string, title: string): LiveSpaceCard {
  const idResult = spaceIdFromString(id);
  if (!idResult.ok) {
    throw new Error(`bad test id: ${id}`);
  }
  return {
    spaceId: idResult.value,
    title,
    listenerCount: 3,
    topicTags: [],
    languageCode: undefined,
    lifecycleState: "live",
    startedAt: new Date("2026-09-01T12:00:00.000Z"),
    scheduledStart: undefined,
    joinUrl: `https://x.com/i/spaces/${id}`,
    sourceKind: "official-api",
  };
}

function snapshot(overrides: Partial<DirectorySnapshot> = {}): DirectorySnapshot {
  return {
    generatedAt: overrides.generatedAt ?? new Date("2026-09-01T12:00:00.000Z"),
    liveCount: overrides.liveCount ?? 1,
    appliedFilters: overrides.appliedFilters ?? DEFAULT_DIRECTORY_FILTERS,
    visibleCards: overrides.visibleCards ?? [card("1AAA", "Alpha")],
    coverage: overrides.coverage,
  };
}

describe("createInMemoryLiveDirectoryCache", () => {
  it("returns undefined before any write", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const result = await cache.readSnapshot();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBeUndefined();
  });

  it("round-trips a written snapshot", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const written = snapshot({
      liveCount: 2,
      visibleCards: [card("1AAA", "Alpha"), card("1BBB", "Beta")],
      coverage: "official-search",
    });

    const writeResult = await cache.writeSnapshot(written);
    expect(writeResult.ok).toBe(true);

    const readResult = await cache.readSnapshot();
    expect(readResult.ok).toBe(true);
    if (!readResult.ok) return;
    expect(readResult.value).toEqual(written);
  });

  it("overwrites prior snapshot on subsequent write", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const first = snapshot({ liveCount: 1, visibleCards: [card("1AAA", "First")] });
    const second = snapshot({
      liveCount: 0,
      visibleCards: [],
      coverage: "cached-after-failure",
    });

    await cache.writeSnapshot(first);
    await cache.writeSnapshot(second);

    const readResult = await cache.readSnapshot();
    expect(readResult.ok).toBe(true);
    if (!readResult.ok) return;
    expect(readResult.value).toEqual(second);
  });

  it("isolates state between adapter instances", async () => {
    const cacheA = createInMemoryLiveDirectoryCache();
    const cacheB = createInMemoryLiveDirectoryCache();
    const snap = snapshot({ liveCount: 7 });

    await cacheA.writeSnapshot(snap);

    const readA = await cacheA.readSnapshot();
    const readB = await cacheB.readSnapshot();

    expect(readA.ok && readA.value).toEqual(snap);
    expect(readB.ok && readB.value).toBeUndefined();
  });

  it("preserves Date instances and optional coverage through the store", async () => {
    const cache = createInMemoryLiveDirectoryCache();
    const generatedAt = new Date("2026-09-04T11:30:00.000Z");
    const written = snapshot({
      generatedAt,
      coverage: "official-search",
    });

    await cache.writeSnapshot(written);
    const readResult = await cache.readSnapshot();
    expect(readResult.ok).toBe(true);
    if (!readResult.ok || readResult.value === undefined) return;

    expect(readResult.value.generatedAt).toBeInstanceOf(Date);
    expect(readResult.value.generatedAt.getTime()).toBe(generatedAt.getTime());
    expect(readResult.value.coverage).toBe("official-search");
  });
});

describe("snapshotIsFresh", () => {
  const generatedAt = new Date("2026-09-04T12:00:00.000Z");
  const base = snapshot({ generatedAt });

  it("returns true when age is younger than maxAgeSeconds", () => {
    const now = new Date("2026-09-04T12:29:59.000Z"); // 1799s
    expect(snapshotIsFresh(base, now, 1800)).toBe(true);
  });

  it("returns false when age is exactly maxAgeSeconds", () => {
    const now = new Date("2026-09-04T12:30:00.000Z"); // exactly 1800s
    expect(snapshotIsFresh(base, now, 1800)).toBe(false);
  });

  it("returns false when age is older than maxAgeSeconds", () => {
    const now = new Date("2026-09-04T12:30:01.000Z"); // 1801s
    expect(snapshotIsFresh(base, now, 1800)).toBe(false);
  });

  it("returns true for future generatedAt (clock skew)", () => {
    const now = new Date("2026-09-04T11:59:00.000Z"); // generatedAt in the future
    expect(snapshotIsFresh(base, now, 1800)).toBe(true);
  });

  it("returns false for non-positive maxAgeSeconds", () => {
    const now = new Date("2026-09-04T12:00:01.000Z");
    expect(snapshotIsFresh(base, now, 0)).toBe(false);
    expect(snapshotIsFresh(base, now, -1)).toBe(false);
    expect(snapshotIsFresh(base, now, Number.NaN)).toBe(false);
  });

  it("returns false when generatedAt or now is an invalid Date", () => {
    const now = new Date("2026-09-04T12:00:01.000Z");
    const invalidGenerated = snapshot({ generatedAt: new Date("not-a-date") });
    expect(snapshotIsFresh(invalidGenerated, now, 1800)).toBe(false);

    const invalidNow = new Date("not-a-date");
    expect(snapshotIsFresh(base, invalidNow, 1800)).toBe(false);
  });
});
