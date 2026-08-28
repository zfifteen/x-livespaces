import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { formatSpaceTiming } from "@/lib/directory/format-space-timing";

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

describe("formatSpaceTiming", () => {
  const now = new Date("2026-08-28T12:00:00.000Z");

  it("returns Started N minutes ago for a recent startedAt", () => {
    const startedAt = new Date("2026-08-28T11:45:00.000Z"); // 15 minutes ago
    const result = formatSpaceTiming(
      card({ id: "1LIVE", startedAt, lifecycleState: "live" }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Started 15 minutes ago");
    }
  });

  it("returns Started 1 minute ago for a one-minute-old space", () => {
    const startedAt = new Date("2026-08-28T11:59:00.000Z");
    const result = formatSpaceTiming(
      card({ id: "1LIVE", startedAt, lifecycleState: "live" }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Started 1 minute ago");
    }
  });

  it("returns Started just now when less than one minute old", () => {
    const startedAt = new Date("2026-08-28T11:59:30.000Z");
    const result = formatSpaceTiming(
      card({ id: "1LIVE", startedAt, lifecycleState: "live" }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Started just now");
    }
  });

  it("switches to hours after 60 minutes", () => {
    const startedAt = new Date("2026-08-28T09:00:00.000Z"); // 3 hours ago
    const result = formatSpaceTiming(
      card({ id: "1LIVE", startedAt, lifecycleState: "live" }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Started 3 hours ago");
    }
  });

  it("uses singular hour for exactly one hour", () => {
    const startedAt = new Date("2026-08-28T11:00:00.000Z");
    const result = formatSpaceTiming(
      card({ id: "1LIVE", startedAt, lifecycleState: "live" }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Started 1 hour ago");
    }
  });

  it("returns Timing unavailable when startedAt and scheduledStart are missing", () => {
    const result = formatSpaceTiming(
      card({ id: "1NODE", lifecycleState: "live" }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Timing unavailable");
    }
  });

  it("returns Timing unavailable when startedAt is undefined even if lifecycle is live", () => {
    const result = formatSpaceTiming(
      card({
        id: "1NODE",
        lifecycleState: "live",
        startedAt: undefined,
        scheduledStart: undefined,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Timing unavailable");
    }
  });

  it("returns Starts in N minutes for a scheduled space with near future start", () => {
    const scheduledStart = new Date("2026-08-28T12:20:00.000Z"); // 20 minutes from now
    const result = formatSpaceTiming(
      card({
        id: "1SCHED",
        lifecycleState: "scheduled",
        scheduledStart,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Starts in 20 minutes");
    }
  });

  it("returns Starts in 1 minute for a one-minute-away scheduled space", () => {
    const scheduledStart = new Date("2026-08-28T12:01:00.000Z");
    const result = formatSpaceTiming(
      card({
        id: "1SCHED",
        lifecycleState: "scheduled",
        scheduledStart,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Starts in 1 minute");
    }
  });

  it("returns Starts soon when scheduled start is less than one minute away", () => {
    const scheduledStart = new Date("2026-08-28T12:00:30.000Z");
    const result = formatSpaceTiming(
      card({
        id: "1SCHED",
        lifecycleState: "scheduled",
        scheduledStart,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Starts soon");
    }
  });

  it("returns Starts in N hours when scheduled more than an hour away but under 24h", () => {
    const scheduledStart = new Date("2026-08-28T15:00:00.000Z"); // 3 hours
    const result = formatSpaceTiming(
      card({
        id: "1SCHED",
        lifecycleState: "scheduled",
        scheduledStart,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Starts in 3 hours");
    }
  });

  it("returns absolute start label when scheduled more than 24 hours away", () => {
    const scheduledStart = new Date("2026-08-30T14:30:00.000Z");
    const result = formatSpaceTiming(
      card({
        id: "1SCHED",
        lifecycleState: "scheduled",
        scheduledStart,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Starts 2026-08-30 14:30 UTC");
    }
  });

  it("prefers startedAt over scheduledStart when both are present", () => {
    const startedAt = new Date("2026-08-28T11:30:00.000Z"); // 30 min ago
    const scheduledStart = new Date("2026-08-28T11:00:00.000Z");
    const result = formatSpaceTiming(
      card({
        id: "1LIVE",
        lifecycleState: "live",
        startedAt,
        scheduledStart,
      }),
      now,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("Started 30 minutes ago");
    }
  });
});
