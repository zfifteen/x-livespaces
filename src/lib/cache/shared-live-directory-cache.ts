/**
 * Shared LiveDirectoryCache: KV when LIVE_DIRECTORY is bound, else in-memory.
 * Selection is pure via resolveLiveDirectoryCache — tests inject a fake KV.
 */

import { createInMemoryLiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";
import { createKvLiveDirectoryCache } from "@/lib/cache/kv-live-directory-cache";

export function resolveLiveDirectoryCache(
  kv: KvNamespaceLike | undefined,
): LiveDirectoryCache {
  if (kv !== undefined) {
    return createKvLiveDirectoryCache(kv);
  }
  return createInMemoryLiveDirectoryCache();
}

let sharedLiveDirectoryCache: LiveDirectoryCache | undefined;

export function getSharedLiveDirectoryCache(
  kv?: KvNamespaceLike,
): LiveDirectoryCache {
  if (sharedLiveDirectoryCache === undefined) {
    sharedLiveDirectoryCache = resolveLiveDirectoryCache(kv);
  }
  return sharedLiveDirectoryCache;
}
