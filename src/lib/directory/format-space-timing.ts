/**
 * Card timing line from CONCEPT §4: "Started X minutes ago" or duration.
 *
 * Intended logic:
 * 1. If startedAt is set, "Started {n} minutes ago" (hours after 60 minutes).
 * 2. Else if lifecycleState is scheduled and scheduledStart is set, "Starts in …"
 *    / "Starts {absolute}" when more than 24h away.
 * 3. If neither date is present, "Timing unavailable".
 * 4. Use `now` as the only clock input so tests stay deterministic.
 */

import { ok, type Result } from "@/domain/result";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import type { LiveSpacesError } from "@/domain/errors";

const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;

function formatPastDuration(msAgo: number): string {
  if (msAgo < MS_PER_MINUTE) {
    return "Started just now";
  }
  const minutes = Math.floor(msAgo / MS_PER_MINUTE);
  if (minutes < 60) {
    return minutes === 1
      ? "Started 1 minute ago"
      : `Started ${minutes} minutes ago`;
  }
  const hours = Math.floor(msAgo / MS_PER_HOUR);
  return hours === 1 ? "Started 1 hour ago" : `Started ${hours} hours ago`;
}

function formatFutureDuration(msUntil: number, scheduledStart: Date): string {
  if (msUntil < MS_PER_MINUTE) {
    return "Starts soon";
  }
  if (msUntil < MS_PER_HOUR) {
    const minutes = Math.floor(msUntil / MS_PER_MINUTE);
    return minutes === 1
      ? "Starts in 1 minute"
      : `Starts in ${minutes} minutes`;
  }
  if (msUntil < MS_PER_DAY) {
    const hours = Math.floor(msUntil / MS_PER_HOUR);
    return hours === 1 ? "Starts in 1 hour" : `Starts in ${hours} hours`;
  }
  // Absolute UTC label for distant starts
  const y = scheduledStart.getUTCFullYear();
  const m = String(scheduledStart.getUTCMonth() + 1).padStart(2, "0");
  const d = String(scheduledStart.getUTCDate()).padStart(2, "0");
  const hh = String(scheduledStart.getUTCHours()).padStart(2, "0");
  const mm = String(scheduledStart.getUTCMinutes()).padStart(2, "0");
  return `Starts ${y}-${m}-${d} ${hh}:${mm} UTC`;
}

export function formatSpaceTiming(
  card: LiveSpaceCard,
  now: Date,
): Result<string, LiveSpacesError> {
  if (card.startedAt !== undefined) {
    const msAgo = now.getTime() - card.startedAt.getTime();
    // Negative (future startedAt) still surfaces a relative label; clamp at 0.
    return ok(formatPastDuration(Math.max(0, msAgo)));
  }

  if (
    card.lifecycleState === "scheduled" &&
    card.scheduledStart !== undefined
  ) {
    const msUntil = card.scheduledStart.getTime() - now.getTime();
    if (msUntil < 0) {
      // Past scheduled start without a startedAt — treat as unavailable.
      return ok("Timing unavailable");
    }
    return ok(formatFutureDuration(msUntil, card.scheduledStart));
  }

  return ok("Timing unavailable");
}
