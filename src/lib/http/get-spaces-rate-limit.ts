/**
 * In-worker rate limit for GET /api/spaces: 60 req/min per IP.
 *
 * Prefer the Workers Rate Limiting binding (free-plan compatible, GA).
 * Fall back to a LIVE_DIRECTORY KV fixed window when the binding is absent.
 * Local `next dev` with neither binding uses allow-all.
 */

import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";

export const GET_SPACES_RATE_LIMIT = 60;
export const GET_SPACES_RATE_WINDOW_SECONDS = 60;

export type RateLimitConsumeResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

export type GetSpacesRateLimiter = {
  consume(input: {
    readonly ip: string;
    readonly now: Date;
  }): Promise<RateLimitConsumeResult>;
};

export type WorkersRateLimitBinding = {
  limit(options: { key: string }): Promise<{ success: boolean }>;
};

export function clientIpFromRequest(request: Request): string {
  const cfConnecting = request.headers.get("cf-connecting-ip")?.trim();
  if (cfConnecting !== undefined && cfConnecting !== "") {
    return cfConnecting;
  }
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded !== null) {
    const first = forwarded.split(",")[0]?.trim();
    if (first !== undefined && first !== "") {
      return first;
    }
  }
  return "unknown";
}

export function createWorkersBindingGetSpacesRateLimiter(
  binding: WorkersRateLimitBinding,
): GetSpacesRateLimiter {
  return {
    consume: async ({ ip }): Promise<RateLimitConsumeResult> => {
      const { success } = await binding.limit({ key: ip });
      if (success) {
        return { allowed: true };
      }
      return {
        allowed: false,
        retryAfterSeconds: GET_SPACES_RATE_WINDOW_SECONDS,
      };
    },
  };
}

function windowStartUnixSeconds(now: Date, windowSeconds: number): number {
  const unix = Math.floor(now.getTime() / 1000);
  return unix - (unix % windowSeconds);
}

export function createFixedWindowGetSpacesRateLimiter(options: {
  readonly kv: KvNamespaceLike;
  readonly limit?: number;
  readonly windowSeconds?: number;
}): GetSpacesRateLimiter {
  const limit = options.limit ?? GET_SPACES_RATE_LIMIT;
  const windowSeconds = options.windowSeconds ?? GET_SPACES_RATE_WINDOW_SECONDS;
  return {
    consume: async ({ ip, now }): Promise<RateLimitConsumeResult> => {
      const start = windowStartUnixSeconds(now, windowSeconds);
      const key = `ratelimit:get-spaces:${ip}:${String(start)}`;
      const raw = await options.kv.get(key);
      const count = raw === null ? 0 : Number(raw);
      const next = Number.isFinite(count) ? count + 1 : 1;
      if (next > limit) {
        const elapsed = Math.floor(now.getTime() / 1000) - start;
        const retryAfterSeconds = Math.max(1, windowSeconds - elapsed);
        return { allowed: false, retryAfterSeconds };
      }
      await options.kv.put(key, String(next), {
        expirationTtl: windowSeconds,
      });
      return { allowed: true };
    },
  };
}

const allowAll: GetSpacesRateLimiter = {
  consume: async (): Promise<RateLimitConsumeResult> => {
    await Promise.resolve();
    return { allowed: true };
  },
};

export function resolveGetSpacesRateLimiter(options: {
  readonly binding?: WorkersRateLimitBinding | undefined;
  readonly kv?: KvNamespaceLike | undefined;
}): GetSpacesRateLimiter {
  if (options.binding !== undefined) {
    return createWorkersBindingGetSpacesRateLimiter(options.binding);
  }
  if (options.kv !== undefined) {
    return createFixedWindowGetSpacesRateLimiter({ kv: options.kv });
  }
  return allowAll;
}
