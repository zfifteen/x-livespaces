/**
 * Cache seam for the assembled directory snapshot.
 *
 * MVP: in-memory adapter for local `next dev`; Cloudflare KV adapter on
 * Workers (`LIVE_DIRECTORY` binding, key `snapshot:v1`). Same interface so
 * `loadLiveDirectory` and `refreshLiveDirectory` stay adapter-agnostic.
 *
 * Freshness is decided by the caller via `snapshotIsFresh` and the global
 * 1,800-second cooldown. The cache itself only stores and returns the last
 * written unfiltered `DirectorySnapshot`.
 */

import { ok } from "@/domain/result";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type LiveDirectoryCache = {
  readonly readSnapshot: () => Promise<Result<DirectorySnapshot | undefined, LiveSpacesError>>;
  readonly writeSnapshot: (snapshot: DirectorySnapshot) => Promise<Result<void, LiveSpacesError>>;
};

/**
 * Process-private in-memory store.
 *
 * Each call to `createInMemoryLiveDirectoryCache` gets its own closed-over
 * cell so tests and concurrent processes do not share state.
 */
export function createInMemoryLiveDirectoryCache(): LiveDirectoryCache {
  let stored: DirectorySnapshot | undefined;

  return {
    readSnapshot: async (): Promise<Result<DirectorySnapshot | undefined, LiveSpacesError>> => {
      return ok(stored);
    },
    writeSnapshot: async (
      snapshot: DirectorySnapshot,
    ): Promise<Result<void, LiveSpacesError>> => {
      stored = snapshot;
      return ok(undefined);
    },
  };
}

/**
 * Whether a snapshot is still inside the global Refresh cooldown window.
 *
 * Returns true when (now - snapshot.generatedAt) < maxAgeSeconds.
 * - maxAgeSeconds must be positive; zero/negative/NaN → never fresh.
 * - Future generatedAt (clock skew) counts as fresh.
 * - Invalid Date on either side → not fresh.
 * Strict less-than: age exactly equal to maxAgeSeconds is stale.
 */
export function snapshotIsFresh(
  snapshot: DirectorySnapshot,
  now: Date,
  maxAgeSeconds: number,
): boolean {
  if (!(maxAgeSeconds > 0)) {
    return false;
  }
  const generatedMs = snapshot.generatedAt.getTime();
  const nowMs = now.getTime();
  if (Number.isNaN(generatedMs) || Number.isNaN(nowMs)) {
    return false;
  }
  const ageMs = nowMs - generatedMs;
  // Future generatedAt (clock skew) counts as fresh.
  if (ageMs < 0) {
    return true;
  }
  return ageMs < maxAgeSeconds * 1000;
}
