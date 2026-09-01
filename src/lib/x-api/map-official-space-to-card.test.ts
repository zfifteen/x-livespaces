import { describe, expect, it } from "vitest";
import { mapOfficialSpaceToCard } from "@/lib/x-api/map-official-space-to-card";

/**
 * Golden fixtures shaped like official X Spaces API Space objects
 * (space.fields: title, participant_count, started_at, scheduled_start, lang, state).
 * No expansions, no user objects.
 */
const LIVE_FIXTURE = {
  id: "1YpJkwXXDrjJj",
  state: "live",
  title: "Building in public",
  participant_count: 128,
  lang: "en",
  started_at: "2026-08-20T14:30:00.000Z",
  scheduled_start: null,
};

const SCHEDULED_FIXTURE = {
  id: "1ABCDEFGhij",
  state: "scheduled",
  title: "Upcoming AMA",
  participant_count: 0,
  lang: "es",
  started_at: null,
  scheduled_start: "2026-08-21T18:00:00.000Z",
};

const ENDED_FIXTURE = {
  id: "1EndedSpace99",
  state: "ended",
  title: "Wrapped up",
  participant_count: 42,
  started_at: "2026-08-19T10:00:00.000Z",
};

describe("mapOfficialSpaceToCard", () => {
  it("maps a live Space fixture to a LiveSpaceCard with no host fields", () => {
    const result = mapOfficialSpaceToCard({ spaceJson: LIVE_FIXTURE });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const card = result.value;
    expect(card.spaceId).toBe("1YpJkwXXDrjJj");
    expect(card.title).toBe("Building in public");
    expect(card.listenerCount).toBe(128);
    expect(card.topicTags).toEqual([]);
    expect(card.languageCode).toBe("en");
    expect(card.lifecycleState).toBe("live");
    expect(card.startedAt).toEqual(new Date("2026-08-20T14:30:00.000Z"));
    expect(card.scheduledStart).toBeUndefined();
    expect(card.joinUrl).toBe("https://x.com/i/spaces/1YpJkwXXDrjJj");
    expect(card.sourceKind).toBe("official-api");
    // MVP: no host identity
    expect(
      Object.keys(card).sort(),
    ).toEqual(
      [
        "joinUrl",
        "languageCode",
        "lifecycleState",
        "listenerCount",
        "scheduledStart",
        "sourceKind",
        "spaceId",
        "startedAt",
        "title",
        "topicTags",
      ].sort(),
    );
  });

  it("maps a scheduled Space with scheduled_start", () => {
    const result = mapOfficialSpaceToCard({ spaceJson: SCHEDULED_FIXTURE });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.lifecycleState).toBe("scheduled");
    expect(result.value.listenerCount).toBe(0);
    expect(result.value.languageCode).toBe("es");
    expect(result.value.startedAt).toBeUndefined();
    expect(result.value.scheduledStart).toEqual(
      new Date("2026-08-21T18:00:00.000Z"),
    );
    expect(result.value.joinUrl).toBe("https://x.com/i/spaces/1ABCDEFGhij");
    expect(result.value.sourceKind).toBe("official-api");
  });

  it("maps an ended Space and tolerates missing optional lang", () => {
    const result = mapOfficialSpaceToCard({ spaceJson: ENDED_FIXTURE });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.lifecycleState).toBe("ended");
    expect(result.value.languageCode).toBeUndefined();
    expect(result.value.startedAt).toEqual(
      new Date("2026-08-19T10:00:00.000Z"),
    );
    expect(result.value.scheduledStart).toBeUndefined();
  });

  it("fails with x-api-payload-unreadable when spaceJson is not an object", () => {
    const result = mapOfficialSpaceToCard({ spaceJson: null });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("fails when id is missing or invalid", () => {
    const missing = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, id: undefined },
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.kind).toBe("x-api-payload-unreadable");
    }

    const badId = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, id: "bad id!" },
    });
    expect(badId.ok).toBe(false);
    if (!badId.ok) {
      expect(badId.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("fails when title is missing or not a string", () => {
    const result = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, title: 42 },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("fails when state is missing or unknown", () => {
    const missing = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, state: undefined },
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.kind).toBe("x-api-payload-unreadable");
    }

    const unknown = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, state: "paused" },
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("fails when participant_count is missing or not a non-negative number", () => {
    const missing = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, participant_count: undefined },
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.kind).toBe("x-api-payload-unreadable");
    }

    const negative = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, participant_count: -1 },
    });
    expect(negative.ok).toBe(false);
    if (!negative.ok) {
      expect(negative.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("treats null optional timestamps and lang as undefined", () => {
    const result = mapOfficialSpaceToCard({
      spaceJson: {
        ...LIVE_FIXTURE,
        lang: null,
        started_at: null,
        scheduled_start: null,
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.languageCode).toBeUndefined();
    expect(result.value.startedAt).toBeUndefined();
    expect(result.value.scheduledStart).toBeUndefined();
  });

  it("fails when a present timestamp is not a parseable ISO string", () => {
    const result = mapOfficialSpaceToCard({
      spaceJson: { ...LIVE_FIXTURE, started_at: "not-a-date" },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-payload-unreadable");
    }
  });
});
