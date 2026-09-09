/**
 * Hero Refresh label and cooldown. UI must not format timestamps itself.
 */

const MS_PER_MINUTE = 60_000;

export function formatRefreshedAgo(
  generatedAt: Date | undefined,
  now: Date,
): string {
  if (generatedAt === undefined) {
    return "Refresh";
  }
  const generatedMs = generatedAt.getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(generatedMs) || Number.isNaN(nowMs)) {
    return "Refresh";
  }
  const msAgo = Math.max(0, nowMs - generatedMs);
  if (msAgo < MS_PER_MINUTE) {
    return "Refreshed just now";
  }
  const minutes = Math.floor(msAgo / MS_PER_MINUTE);
  return minutes === 1
    ? "Refreshed 1 min ago"
    : `Refreshed ${minutes} min ago`;
}

export function isWithinRefreshCooldown(
  generatedAt: Date,
  now: Date,
  maxAgeSeconds: number,
): boolean {
  if (!(maxAgeSeconds > 0)) {
    return false;
  }
  const generatedMs = generatedAt.getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(generatedMs) || Number.isNaN(nowMs)) {
    return false;
  }
  const ageMs = nowMs - generatedMs;
  if (ageMs < 0) {
    return true;
  }
  return ageMs < maxAgeSeconds * 1000;
}

export function refreshButtonLabel(input: {
  readonly generatedAt: Date | undefined;
  readonly now: Date;
  readonly inFlight: boolean;
}): string {
  if (input.inFlight) {
    return "Refreshing…";
  }
  return formatRefreshedAgo(input.generatedAt, input.now);
}

export function refreshButtonDisabled(input: {
  readonly generatedAt: Date | undefined;
  readonly now: Date;
  readonly inFlight: boolean;
  readonly cooldownSeconds: number;
}): boolean {
  if (input.inFlight) {
    return true;
  }
  if (input.generatedAt === undefined) {
    return false;
  }
  return isWithinRefreshCooldown(
    input.generatedAt,
    input.now,
    input.cooldownSeconds,
  );
}
