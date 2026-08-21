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

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";

export type OfficialSpaceMappingInput = {
  readonly spaceJson: unknown;
};

export function mapOfficialSpaceToCard(
  input: OfficialSpaceMappingInput,
): Result<LiveSpaceCard, LiveSpacesError> {
  void input;
  return notImplementedYet("mapOfficialSpaceToCard");
}
