/**
 * Typed view of process environment for LiveSpaces.
 *
 * Intended logic (MVP, TECH_SPEC v1.3):
 * 1. Read `X_API_BEARER_TOKEN`. Empty or missing → `missing-bearer-token`
 *    (required only by refresh-side callers).
 * 2. Read `REFRESH_COOLDOWN_SECONDS`, default 1800, require a positive integer.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type LiveSpacesEnvironment = {
  readonly xApiBearerToken: string;
  readonly refreshCooldownSeconds: number;
};

export function readLiveSpacesEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): Result<LiveSpacesEnvironment, LiveSpacesError> {
  void env;
  return notImplementedYet("readLiveSpacesEnvironment");
}
