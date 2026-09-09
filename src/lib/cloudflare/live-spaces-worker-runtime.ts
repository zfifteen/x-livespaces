/**
 * OpenNext Worker bindings. Local next/vitest have no Cloudflare context.
 * Never log secrets.
 */

import type { JoinMetricsStore } from "@/lib/analytics/join-metrics-store";
import { getSharedJoinMetricsStore } from "@/lib/analytics/shared-join-metrics-store";
import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import { getSharedLiveDirectoryCache } from "@/lib/cache/shared-live-directory-cache";
import {
  resolveGetSpacesRateLimiter,
  type GetSpacesRateLimiter,
  type WorkersRateLimitBinding,
} from "@/lib/http/get-spaces-rate-limit";

type LiveSpacesWorkerEnv = {
  LIVE_DIRECTORY?: KvNamespaceLike;
  GET_SPACES_RATE_LIMITER?: WorkersRateLimitBinding;
};

export type LiveSpacesWorkerRuntime = {
  readonly cache: LiveDirectoryCache;
  readonly joinStore: JoinMetricsStore;
  readonly rateLimiter: GetSpacesRateLimiter;
};

export async function readLiveSpacesWorkerEnv(): Promise<{
  readonly liveDirectoryKv: KvNamespaceLike | undefined;
  readonly rateLimitBinding: WorkersRateLimitBinding | undefined;
}> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const env = ctx.env as typeof ctx.env & LiveSpacesWorkerEnv;
    return {
      liveDirectoryKv: env.LIVE_DIRECTORY,
      rateLimitBinding: env.GET_SPACES_RATE_LIMITER,
    };
  } catch {
    return {
      liveDirectoryKv: undefined,
      rateLimitBinding: undefined,
    };
  }
}

export async function getLiveSpacesWorkerRuntime(): Promise<LiveSpacesWorkerRuntime> {
  const env = await readLiveSpacesWorkerEnv();
  return {
    cache: getSharedLiveDirectoryCache(env.liveDirectoryKv),
    joinStore: getSharedJoinMetricsStore(env.liveDirectoryKv),
    rateLimiter: resolveGetSpacesRateLimiter({
      binding: env.rateLimitBinding,
      kv: env.liveDirectoryKv,
    }),
  };
}
