/**
 * Convert one official Spaces payload object into a card.
 *
 * Intended logic (MVP — no User expansions):
 * 1. Read `id`, `title`, `state`, `participant_count`, `lang`, `started_at`,
 *    `scheduled_start` from unknown JSON via explicit field checks (no `as` casts).
 * 2. Brand `id` with `spaceIdFromString`.
 * 3. Build `joinUrl` as `https://x.com/i/spaces/{id}`.
 * 4. Topic tags empty in MVP (no topic expansions).
 * 5. `sourceKind` is `official-api`.
 *
 * Failure: `x-api-payload-unreadable` when required fields are missing.
 */

import { spaceIdFromString } from "@/domain/branded-ids";
import type { LiveSpacesError } from "@/domain/errors";
import type { LiveSpaceCard, SpaceLifecycleState } from "@/domain/live-space-card";
import { err, ok, type Result } from "@/domain/result";
import { buildJoinUrl } from "@/lib/directory/build-join-url";

export type OfficialSpaceMappingInput = {
  readonly spaceJson: unknown;
};

const LIFECYCLE_STATES = new Set<string>(["live", "scheduled", "ended"]);

function unreadable(message: string): LiveSpacesError {
  return {
    kind: "x-api-payload-unreadable",
    message,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptionalIsoDate(
  value: unknown,
  fieldName: string,
): Result<Date | undefined, LiveSpacesError> {
  if (value === undefined || value === null) {
    return ok(undefined);
  }
  if (typeof value !== "string") {
    return err(unreadable(`Official Space ${fieldName} must be a string or null`));
  }
  const trimmed = value.trim();
  if (trimmed === "") {
    return ok(undefined);
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return err(
      unreadable(`Official Space ${fieldName} is not a valid ISO timestamp`),
    );
  }
  return ok(date);
}

export function mapOfficialSpaceToCard(
  input: OfficialSpaceMappingInput,
): Result<LiveSpaceCard, LiveSpacesError> {
  const { spaceJson } = input;

  if (!isRecord(spaceJson)) {
    return err(unreadable("Official Space payload is not an object"));
  }

  const rawId = spaceJson["id"];
  if (typeof rawId !== "string") {
    return err(unreadable("Official Space id is missing or not a string"));
  }
  const idResult = spaceIdFromString(rawId);
  if (!idResult.ok) {
    return err(unreadable(`Official Space id is invalid: ${rawId}`));
  }
  const spaceId = idResult.value;

  const rawTitle = spaceJson["title"];
  if (typeof rawTitle !== "string") {
    return err(unreadable("Official Space title is missing or not a string"));
  }
  const title = rawTitle;

  const rawState = spaceJson["state"];
  if (typeof rawState !== "string" || !LIFECYCLE_STATES.has(rawState)) {
    return err(
      unreadable("Official Space state is missing or not a known lifecycle value"),
    );
  }
  const lifecycleState = rawState as SpaceLifecycleState;

  const rawCount = spaceJson["participant_count"];
  if (
    typeof rawCount !== "number" ||
    !Number.isFinite(rawCount) ||
    rawCount < 0
  ) {
    return err(
      unreadable(
        "Official Space participant_count is missing or not a non-negative number",
      ),
    );
  }
  const listenerCount = Math.floor(rawCount);

  let languageCode: string | undefined;
  const rawLang = spaceJson["lang"];
  if (rawLang === undefined || rawLang === null) {
    languageCode = undefined;
  } else if (typeof rawLang === "string") {
    const trimmed = rawLang.trim();
    languageCode = trimmed === "" ? undefined : trimmed;
  } else {
    return err(unreadable("Official Space lang must be a string or null"));
  }

  const startedAtResult = parseOptionalIsoDate(
    spaceJson["started_at"],
    "started_at",
  );
  if (!startedAtResult.ok) {
    return startedAtResult;
  }

  const scheduledStartResult = parseOptionalIsoDate(
    spaceJson["scheduled_start"],
    "scheduled_start",
  );
  if (!scheduledStartResult.ok) {
    return scheduledStartResult;
  }

  const joinResult = buildJoinUrl(spaceId);
  if (!joinResult.ok) {
    return joinResult;
  }

  const card: LiveSpaceCard = {
    spaceId,
    title,
    listenerCount,
    topicTags: [],
    languageCode,
    lifecycleState,
    startedAt: startedAtResult.value,
    scheduledStart: scheduledStartResult.value,
    joinUrl: joinResult.value,
    sourceKind: "official-api",
  };

  return ok(card);
}
