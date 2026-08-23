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

import { notImplementedYet } from "@/domain/result";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type LiveDirectoryCache = {
  readonly readSnapshot: () => Promise<Result<DirectorySnapshot | undefined, LiveSpacesError>>;
  readonly writeSnapshot: (snapshot: DirectorySnapshot) => Promise<Result<void, LiveSpacesError>>;
};

export function createInMemoryLiveDirectoryCache(): LiveDirectoryCache {
  return {
    readSnapshot: () => Promise.resolve(notImplementedYet("LiveDirectoryCache.readSnapshot")),
    writeSnapshot: (snapshot: DirectorySnapshot) => {
      void snapshot;
      return Promise.resolve(notImplementedYet("LiveDirectoryCache.writeSnapshot"));
    },
  };
}

export function snapshotIsFresh(
  snapshot: DirectorySnapshot,
  now: Date,
  maxAgeSeconds: number,
): boolean {
  // Intended logic: return true when (now - snapshot.generatedAt) < maxAgeSeconds.
  // Guard maxAgeSeconds > 0. Treat future generatedAt as fresh (clock skew).
  void snapshot;
  void now;
  void maxAgeSeconds;
  return false;
}
