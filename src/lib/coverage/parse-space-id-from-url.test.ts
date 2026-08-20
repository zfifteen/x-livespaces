import { describe, expect, it } from "vitest";
import { parseSpaceIdFromUrl } from "@/lib/coverage/parse-space-id-from-url";

describe("parseSpaceIdFromUrl", () => {
  it.todo("accepts https://x.com/i/spaces/{id}");

  it.todo("accepts twitter.com and query strings");

  it.todo("rejects profile URLs and empty strings");

  it("is still a Phase 1 stub", () => {
    const result = parseSpaceIdFromUrl("https://x.com/i/spaces/1ABC");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("not-implemented");
    }
  });
});
