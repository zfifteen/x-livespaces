import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { createFakeKvNamespace } from "@/lib/cache/fake-kv-namespace";
import {
  LIVE_DIRECTORY_SNAPSHOT_KEY,
  createKvLiveDirectoryCache,
} from "@/lib/cache/kv-live-directory-cache";
import { resolveLiveDirectoryCache } from "@/lib/cache/shared-live-directory-cache";

function card(id: string, title: string): LiveSpaceCard {
  const idResult = spaceIdFromString(id);
  if (!idResult.ok) {
    throw new Error(`bad test id: ${id}`);
  }
  return {
    spaceId: idResult.value,
    title,
    listenerCount: 3,
    topicTags: ["news"],
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
  return base;
}

describe("createKvLiveDirectoryCache", () => {
  it("returns undefined when the snapshot key is missing", async () => {
    const cache = createKvLiveDirectoryCache(createFakeKvNamespace());
    const result = await cache.readSnapshot();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBeUndefined();
  });

  it("round-trips a snapshot through snapshot:v1 without KV expiry", async () => {
    const kv = createFakeKvNamespace();
    const cache = createKvLiveDirectoryCache(kv);
    const written = snapshot({
      liveCount: 2,
      visibleCards: [card("1AAA", "Alpha"), card("1BBB", "Beta")],
      coverage: "official-search",
    });
    const writeResult = await cache.writeSnapshot(written);
    expect(writeResult.ok).toBe(true);
    expect(kv.puts[0]?.key).toBe(LIVE_DIRECTORY_SNAPSHOT_KEY);
    expect(kv.puts[0]?.expirationTtl).toBeUndefined();

    const readResult = await cache.readSnapshot();
    expect(readResult.ok).toBe(true);
    if (!readResult.ok) return;
    expect(readResult.value).toEqual(written);
    expect(readResult.value?.generatedAt).toBeInstanceOf(Date);
  });

  it("rejects a payload over 25 MiB", async () => {
    const cache = createKvLiveDirectoryCache(createFakeKvNamespace());
    const hugeTitle = "x".repeat(26 * 1024 * 1024);
    const written = snapshot({
      visibleCards: [card("1AAA", hugeTitle)],
    });
    const writeResult = await cache.writeSnapshot(written);
    expect(writeResult.ok).toBe(false);
  });
});

describe("resolveLiveDirectoryCache", () => {
  it("uses in-memory when no KV binding is present", async () => {
    const a = resolveLiveDirectoryCache(undefined);
    const b = resolveLiveDirectoryCache(undefined);
    await a.writeSnapshot(snapshot({ liveCount: 4 }));
    const readB = await b.readSnapshot();
    expect(readB.ok && readB.value).toBeUndefined();
  });

  it("uses KV when a binding is provided", async () => {
    const kv = createFakeKvNamespace();
    const writer = resolveLiveDirectoryCache(kv);
    const reader = resolveLiveDirectoryCache(kv);
    const written = snapshot({ liveCount: 9, coverage: "official-search" });
    await writer.writeSnapshot(written);
    const read = await reader.readSnapshot();
    expect(read.ok && read.value).toEqual(written);
  });
});
