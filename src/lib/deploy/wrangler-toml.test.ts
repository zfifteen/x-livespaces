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

  it("declares two separate KV bindings with placeholder ids", () => {
    expect(toml).toMatch(/binding\s*=\s*"LIVE_DIRECTORY"/);
    expect(toml).toMatch(/binding\s*=\s*"NEXT_INC_CACHE_KV"/);
    expect(toml).toMatch(/REPLACE_WITH_LIVE_DIRECTORY_KV_NAMESPACE_ID/);
    expect(toml).toMatch(/REPLACE_WITH_NEXT_INC_CACHE_KV_NAMESPACE_ID/);
    expect(toml).not.toMatch(/account_id\s*=/);
  });

  it("declares in-worker GET /api/spaces rate limit 60 per 60s", () => {
    expect(toml).toMatch(/name\s*=\s*"GET_SPACES_RATE_LIMITER"/);
    expect(toml).toMatch(/namespace_id\s*=\s*"1001"/);
    expect(toml).toMatch(/limit\s*=\s*60/);
    expect(toml).toMatch(/period\s*=\s*60/);
  });
});
