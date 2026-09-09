import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("wrangler.toml S29 contract", () => {
  const toml = readFileSync(resolve(process.cwd(), "wrangler.toml"), "utf8");

  it("pins nodejs_compat and a compatibility_date without edge runtime", () => {
    expect(toml).toMatch(/compatibility_date\s*=\s*"2026-09-09"/);
    expect(toml).toMatch(/nodejs_compat/);
    expect(toml).not.toMatch(/^\s*runtime\s*=\s*"edge"/m);
  });

  it("declares two separate KV bindings with real ids (no placeholders)", () => {
    expect(toml).toMatch(/binding\s*=\s*"LIVE_DIRECTORY"/);
    expect(toml).toMatch(/binding\s*=\s*"NEXT_INC_CACHE_KV"/);
    expect(toml).not.toMatch(/REPLACE_WITH_/);
    expect(toml).not.toMatch(/account_id\s*=/);
    const ids = [...toml.matchAll(/^id\s*=\s*"([0-9a-f]{32})"/gm)];
    expect(ids.length).toBe(2);
    expect(new Set(ids.map((m) => m[1])).size).toBe(2);
  });

  it("does not bind the Workers Rate Limiting binding (KV-backed limiter instead)", () => {
    expect(toml).not.toMatch(/\[\[ratelimits\]\]/);
    expect(toml).not.toMatch(/GET_SPACES_RATE_LIMITER/);
  });
});
