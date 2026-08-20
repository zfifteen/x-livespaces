/**
 * Canonical Join URL for a Space. CONCEPT: one-click join via official links.
 *
 * Intended logic: `https://x.com/i/spaces/` + spaceId. No extra query params.
 */

import { notImplementedYet } from "@/domain/result";
import type { SpaceId } from "@/domain/branded-ids";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export function buildJoinUrl(spaceId: SpaceId): Result<string, LiveSpacesError> {
  void spaceId;
  return notImplementedYet("buildJoinUrl");
}
