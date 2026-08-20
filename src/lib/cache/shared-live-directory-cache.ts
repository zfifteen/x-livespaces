/**
 * Process-local cache instance used by Route Handlers and the home page.
 *
 * Intended logic: lazily construct `createInMemoryLiveDirectoryCache()` once
 * per Node process. Serverless runtimes each have their own instance; Redis
 * replaces this module later without changing callers.
 */

import { createInMemoryLiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";

let sharedLiveDirectoryCache: LiveDirectoryCache | undefined;

export function getSharedLiveDirectoryCache(): LiveDirectoryCache {
  if (sharedLiveDirectoryCache === undefined) {
    sharedLiveDirectoryCache = createInMemoryLiveDirectoryCache();
  }
  return sharedLiveDirectoryCache;
}
