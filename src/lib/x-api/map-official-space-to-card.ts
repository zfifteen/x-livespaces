/**
 * Convert one official Spaces payload object plus included users into a card.
 *
 * Intended logic:
 * 1. Read `id`, `title`, `state`, `participant_count`, `lang`, `started_at`,
 *    `scheduled_start`, `creator_id`, `host_ids` from unknown JSON via
 *    explicit field checks (no `as` casts).
 * 2. Brand `id` with `spaceIdFromString`.
 * 3. Resolve the host from included users: prefer `creator_id`, else first host.
 * 4. Build `joinUrl` as `https://x.com/i/spaces/{id}`.
 * 5. Topic tags: map `topic_ids` through included topics when present;
 *    otherwise empty list (MVP can show title keywords later).
 * 6. `sourceKind` is `official-api` at this layer; merge happens upstream.
 *
 * Failure: `x-api-payload-unreadable` when required fields are missing.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";

export type OfficialSpaceMappingInput = {
  readonly spaceJson: unknown;
  readonly includedUsersJson: unknown;
  readonly includedTopicsJson: unknown;
};

export function mapOfficialSpaceToCard(
  input: OfficialSpaceMappingInput,
): Result<LiveSpaceCard, LiveSpacesError> {
  void input;
  return notImplementedYet("mapOfficialSpaceToCard");
}
