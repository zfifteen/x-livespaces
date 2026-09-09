import { describe, expect, it } from "vitest";
import {
  formatRefreshedAgo,
  isWithinRefreshCooldown,
  refreshButtonDisabled,
  refreshButtonLabel,
} from "@/lib/directory/format-refreshed-ago";

describe("formatRefreshedAgo", () => {
  const now = new Date("2026-09-09T12:00:00.000Z");

  it("returns Refresh when generatedAt is missing", () => {
    expect(formatRefreshedAgo(undefined, now)).toBe("Refresh");
  });

  it("returns Refreshed just now under one minute", () => {
    expect(
      formatRefreshedAgo(new Date("2026-09-09T11:59:30.000Z"), now),
    ).toBe("Refreshed just now");
  });

  it("returns Refreshed N min ago for whole minutes", () => {
    expect(
      formatRefreshedAgo(new Date("2026-09-09T11:45:00.000Z"), now),
    ).toBe("Refreshed 15 min ago");
  });

  it("uses singular min for one minute", () => {
    expect(
      formatRefreshedAgo(new Date("2026-09-09T11:59:00.000Z"), now),
    ).toBe("Refreshed 1 min ago");
  });
});

describe("isWithinRefreshCooldown", () => {
  const generatedAt = new Date("2026-09-09T12:00:00.000Z");

  it("is true while age is strictly under 1800s", () => {
    expect(
      isWithinRefreshCooldown(
        generatedAt,
        new Date("2026-09-09T12:29:59.000Z"),
        1800,
      ),
    ).toBe(true);
  });

  it("is false at exactly 1800s", () => {
    expect(
      isWithinRefreshCooldown(
        generatedAt,
        new Date("2026-09-09T12:30:00.000Z"),
        1800,
      ),
    ).toBe(false);
  });
});

describe("refreshButtonLabel", () => {
  it("says Refreshing while in flight", () => {
    expect(
      refreshButtonLabel({
        generatedAt: new Date("2026-09-09T12:00:00.000Z"),
        now: new Date("2026-09-09T12:05:00.000Z"),
        inFlight: true,
      }),
    ).toBe("Refreshing…");
  });

  it("otherwise uses formatRefreshedAgo", () => {
    expect(
      refreshButtonLabel({
        generatedAt: new Date("2026-09-09T12:00:00.000Z"),
        now: new Date("2026-09-09T12:05:00.000Z"),
        inFlight: false,
      }),
    ).toBe("Refreshed 5 min ago");
  });
});

describe("refreshButtonDisabled", () => {
  const generatedAt = new Date("2026-09-09T12:00:00.000Z");
  const now = new Date("2026-09-09T12:05:00.000Z");

  it("disables while in flight even if cooldown has expired", () => {
    expect(
      refreshButtonDisabled({
        generatedAt: undefined,
        now,
        inFlight: true,
        cooldownSeconds: 1800,
      }),
    ).toBe(true);
  });

  it("disables while cooldown is active", () => {
    expect(
      refreshButtonDisabled({
        generatedAt,
        now,
        inFlight: false,
        cooldownSeconds: 1800,
      }),
    ).toBe(true);
  });

  it("enables when there is no stored generatedAt and not in flight", () => {
    expect(
      refreshButtonDisabled({
        generatedAt: undefined,
        now,
        inFlight: false,
        cooldownSeconds: 1800,
      }),
    ).toBe(false);
  });
});

