import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { mergeDirectorySources } from "@/lib/directory/merge-directory-sources";

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

describe("mergeDirectorySources", () => {
  it("returns empty array when no batches are provided", () => {
    const result = mergeDirectorySources({ officialBatches: [] });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("returns empty array when all batches are empty", () => {
    const result = mergeDirectorySources({
      officialBatches: [[], []],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("unions cards from multiple batches by spaceId; first occurrence wins", () => {
    const first = card({
      id: "1AAA",
      title: "First title",
      listenerCount: 10,
      lifecycleState: "live",
    });
    const duplicate = card({
      id: "1AAA",
      title: "Later title should be dropped",
      listenerCount: 999,
      lifecycleState: "scheduled",
    });
    const other = card({
      id: "1BBB",
      title: "Other",
      listenerCount: 5,
      lifecycleState: "live",
    });

    const result = mergeDirectorySources({
      officialBatches: [[first], [duplicate, other]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      const byId = Object.fromEntries(
        result.value.map((c) => [c.spaceId, c]),
      );
      expect(byId["1AAA"]!.title).toBe("First title");
      expect(byId["1AAA"]!.listenerCount).toBe(10);
      expect(byId["1BBB"]!.title).toBe("Other");
    }
  });

  it("sorts live before scheduled and ended", () => {
    const scheduled = card({
      id: "1SCHED",
      lifecycleState: "scheduled",
      listenerCount: 100,
    });
    const ended = card({
      id: "1ENDED",
      lifecycleState: "ended",
      listenerCount: 200,
    });
    const live = card({
      id: "1LIVE",
      lifecycleState: "live",
      listenerCount: 1,
    });

    const result = mergeDirectorySources({
      officialBatches: [[scheduled, ended, live]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((c) => c.spaceId)).toEqual([
        "1LIVE",
        "1SCHED",
        "1ENDED",
      ]);
    }
  });

  it("within the same lifecycle, sorts by listenerCount descending", () => {
    const low = card({ id: "1LOW", listenerCount: 5, lifecycleState: "live" });
    const mid = card({ id: "1MID", listenerCount: 50, lifecycleState: "live" });
    const high = card({
      id: "1HIGH",
      listenerCount: 200,
      lifecycleState: "live",
    });

    const result = mergeDirectorySources({
      officialBatches: [[low, high, mid]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((c) => c.spaceId)).toEqual([
        "1HIGH",
        "1MID",
        "1LOW",
      ]);
    }
  });

  it("within same lifecycle and listenerCount, sorts by startedAt ascending", () => {
    const older = card({
      id: "1OLD",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: new Date("2026-08-28T10:00:00.000Z"),
    });
    const newer = card({
      id: "1NEW",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: new Date("2026-08-28T11:00:00.000Z"),
    });

    const result = mergeDirectorySources({
      officialBatches: [[newer, older]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((c) => c.spaceId)).toEqual(["1OLD", "1NEW"]);
    }
  });

  it("places cards with undefined startedAt after those with a startedAt", () => {
    const withStart = card({
      id: "1START",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: new Date("2026-08-28T10:00:00.000Z"),
    });
    const noStart = card({
      id: "1NONE",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: undefined,
    });

    const result = mergeDirectorySources({
      officialBatches: [[noStart, withStart]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((c) => c.spaceId)).toEqual([
        "1START",
        "1NONE",
      ]);
    }
  });

  it("is stable for complete ties (same lifecycle, listeners, startedAt)", () => {
    const a = card({
      id: "1A",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: new Date("2026-08-28T10:00:00.000Z"),
      title: "A",
    });
    const b = card({
      id: "1B",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: new Date("2026-08-28T10:00:00.000Z"),
      title: "B",
    });
    const c = card({
      id: "1C",
      listenerCount: 10,
      lifecycleState: "live",
      startedAt: new Date("2026-08-28T10:00:00.000Z"),
      title: "C",
    });

    const result = mergeDirectorySources({
      officialBatches: [[a, b, c]],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((c) => c.spaceId)).toEqual(["1A", "1B", "1C"]);
    }
  });

  it("preserves sourceKind official-api on every card", () => {
    const a = card({ id: "1A", lifecycleState: "live" });
    const result = mergeDirectorySources({
      officialBatches: [[a]],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.every((c) => c.sourceKind === "official-api")).toBe(
        true,
      );
    }
  });

  it("handles a single batch without mutation of input order beyond sort", () => {
    const cards = [
      card({ id: "1C", listenerCount: 1, lifecycleState: "live" }),
      card({ id: "1A", listenerCount: 30, lifecycleState: "live" }),
      card({ id: "1B", listenerCount: 20, lifecycleState: "live" }),
    ];
    const result = mergeDirectorySources({
      officialBatches: [cards],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.map((c) => c.spaceId)).toEqual([
        "1A",
        "1B",
        "1C",
      ]);
    }
  });
});
