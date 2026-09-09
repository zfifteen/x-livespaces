import { describe, expect, it } from "vitest";
import { createFakeKvNamespace } from "@/lib/cache/fake-kv-namespace";
import {
  GET_SPACES_RATE_LIMIT,
  GET_SPACES_RATE_WINDOW_SECONDS,
  clientIpFromRequest,
  createFixedWindowGetSpacesRateLimiter,
  createWorkersBindingGetSpacesRateLimiter,
  resolveGetSpacesRateLimiter,
} from "@/lib/http/get-spaces-rate-limit";

function fakeWorkersBinding(limit: number) {
  const counts = new Map<string, number>();
  return {
    limit: async ({ key }: { key: string }): Promise<{ success: boolean }> => {
      await Promise.resolve();
      const next = (counts.get(key) ?? 0) + 1;
      counts.set(key, next);
      return { success: next <= limit };
    },
  };
}

describe("clientIpFromRequest", () => {
  it("prefers CF-Connecting-IP then the first X-Forwarded-For hop", () => {
    expect(
      clientIpFromRequest(
        new Request("https://livespaces.example/api/spaces", {
          headers: {
            "CF-Connecting-IP": "203.0.113.9",
            "X-Forwarded-For": "198.51.100.1, 203.0.113.9",
          },
        }),
      ),
    ).toBe("203.0.113.9");
    expect(
      clientIpFromRequest(
        new Request("https://livespaces.example/api/spaces", {
          headers: { "X-Forwarded-For": "198.51.100.2, 10.0.0.1" },
        }),
      ),
    ).toBe("198.51.100.2");
    expect(
      clientIpFromRequest(new Request("https://livespaces.example/api/spaces")),
    ).toBe("unknown");
  });
});

describe("createWorkersBindingGetSpacesRateLimiter", () => {
  it("allows up to 60 per key then denies with Retry-After 60", async () => {
    const limiter = createWorkersBindingGetSpacesRateLimiter(
      fakeWorkersBinding(GET_SPACES_RATE_LIMIT),
    );
    const now = new Date("2026-09-09T12:00:00.000Z");
    for (let i = 0; i < GET_SPACES_RATE_LIMIT; i += 1) {
      const allowed = await limiter.consume({ ip: "203.0.113.9", now });
      expect(allowed).toEqual({ allowed: true });
    }
    const denied = await limiter.consume({ ip: "203.0.113.9", now });
    expect(denied).toEqual({
      allowed: false,
      retryAfterSeconds: GET_SPACES_RATE_WINDOW_SECONDS,
    });
    const other = await limiter.consume({ ip: "198.51.100.7", now });
    expect(other).toEqual({ allowed: true });
  });
});

describe("createFixedWindowGetSpacesRateLimiter", () => {
  it("uses a KV-backed fixed window and resets after the window", async () => {
    const kv = createFakeKvNamespace();
    const limiter = createFixedWindowGetSpacesRateLimiter({
      kv,
      limit: 2,
      windowSeconds: 60,
    });
    const t0 = new Date("2026-09-09T12:00:10.000Z");
    expect(await limiter.consume({ ip: "203.0.113.9", now: t0 })).toEqual({
      allowed: true,
    });
    expect(await limiter.consume({ ip: "203.0.113.9", now: t0 })).toEqual({
      allowed: true,
    });
    const denied = await limiter.consume({ ip: "203.0.113.9", now: t0 });
    expect(denied.allowed).toBe(false);
    if (!denied.allowed) {
      expect(denied.retryAfterSeconds).toBeGreaterThan(0);
      expect(denied.retryAfterSeconds).toBeLessThanOrEqual(60);
    }
    const later = new Date("2026-09-09T12:01:00.000Z");
    expect(await limiter.consume({ ip: "203.0.113.9", now: later })).toEqual({
      allowed: true,
    });
  });
});

describe("resolveGetSpacesRateLimiter", () => {
  it("prefers KV, then the Workers binding, then allow-all", async () => {
    const now = new Date("2026-09-09T12:00:00.000Z");
    const kvLimiter = resolveGetSpacesRateLimiter({
      binding: fakeWorkersBinding(0),
      kv: createFakeKvNamespace(),
    });
    expect(await kvLimiter.consume({ ip: "1.1.1.1", now })).toEqual({
      allowed: true,
    });

    const binding = fakeWorkersBinding(1);
    const fromBinding = resolveGetSpacesRateLimiter({ binding });
    expect(await fromBinding.consume({ ip: "1.1.1.1", now })).toEqual({
      allowed: true,
    });
    expect(await fromBinding.consume({ ip: "1.1.1.1", now })).toEqual({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const open = resolveGetSpacesRateLimiter({});
    expect(await open.consume({ ip: "1.1.1.1", now })).toEqual({
      allowed: true,
    });
    expect(await open.consume({ ip: "1.1.1.1", now })).toEqual({
      allowed: true,
    });
  });
});

describe("createFixedWindowGetSpacesRateLimiter failure mode", () => {
  it("fails open when KV throws", async () => {
    const brokenKv = {
      get: (): Promise<string | null> => Promise.reject(new Error("KV down")),
      put: (): Promise<void> => Promise.reject(new Error("KV down")),
    };
    const limiter = createFixedWindowGetSpacesRateLimiter({ kv: brokenKv });
    const now = new Date("2026-09-09T12:00:00.000Z");
    expect(await limiter.consume({ ip: "203.0.113.9", now })).toEqual({
      allowed: true,
    });
  });
});
