/**
 * Card timing line from CONCEPT §4: "Started X minutes ago" or duration.
 *
 * Intended logic:
 * 1. If lifecycleState is scheduled and scheduledStart is set, "Starts in …"
 *    / "Starts {absolute}" when more than 24h away.
 * 2. If startedAt is set, "Started {n} minutes ago" (hours after 60 minutes).
 * 3. If neither date is present, "Timing unavailable".
 * 4. Use `now` as the only clock input so tests stay deterministic.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export function formatSpaceTiming(card: LiveSpaceCard, now: Date): Result<string, LiveSpacesError> {
  void card;
  void now;
  return notImplementedYet("formatSpaceTiming");
}
