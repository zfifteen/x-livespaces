/**
 * Typed view of process environment for LiveSpaces.
 *
 * Intended logic (MVP, TECH_SPEC v1.3):
 * 1. Read `X_API_BEARER_TOKEN`. Empty or missing → `missing-bearer-token`
 *    (required only by refresh-side callers).
 * 2. Read `REFRESH_COOLDOWN_SECONDS`, default 1800, require a positive integer.
 */

import { err, ok } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type LiveSpacesEnvironment = {
  readonly xApiBearerToken: string;
  readonly refreshCooldownSeconds: number;
};

const DEFAULT_REFRESH_COOLDOWN_SECONDS = 1800;

function isPositiveIntegerString(raw: string): boolean {
  if (raw.trim() === "") {
    return false;
  }
  const n = Number(raw);
  return Number.isInteger(n) && n > 0;
}

export function readLiveSpacesEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): Result<LiveSpacesEnvironment, LiveSpacesError> {
  const rawBearer = env["X_API_BEARER_TOKEN"];
  if (rawBearer === undefined || rawBearer.trim() === "") {
    return err({
      kind: "missing-bearer-token",
      message: "X_API_BEARER_TOKEN is required",
    });
  }

  const rawCooldown = env["REFRESH_COOLDOWN_SECONDS"];
  let refreshCooldownSeconds = DEFAULT_REFRESH_COOLDOWN_SECONDS;
  if (rawCooldown !== undefined) {
    if (!isPositiveIntegerString(rawCooldown)) {
      return err({
        kind: "missing-bearer-token",
        message: "REFRESH_COOLDOWN_SECONDS must be a positive integer",
      });
    }
    refreshCooldownSeconds = Number(rawCooldown);
  }

  return ok({
    xApiBearerToken: rawBearer.trim(),
    refreshCooldownSeconds,
  });
}
