/**
 * Typed view of process environment for LiveSpaces.
 *
 * Intended logic:
 * 1. Read `X_API_BEARER_TOKEN`. Empty or missing → `missing-bearer-token`.
 * 2. Read `CRON_SECRET` (may be empty in local dev; refresh route must fail closed if empty).
 * 3. Read `LIVE_DIRECTORY_POLL_INTERVAL_SECONDS`, default 45, clamp to 30–60 per CONCEPT §6.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type LiveSpacesEnvironment = {
  readonly xApiBearerToken: string;
  readonly cronSecret: string;
  readonly pollIntervalSeconds: number;
};

export function readLiveSpacesEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): Result<LiveSpacesEnvironment, LiveSpacesError> {
  void env;
  return notImplementedYet("readLiveSpacesEnvironment");
}
