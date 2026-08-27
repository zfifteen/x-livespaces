import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";
import { buildJoinUrl } from "@/lib/directory/build-join-url";

describe("buildJoinUrl", () => {
  it("returns the exact absolute official join URL", () => {
    const idResult = spaceIdFromString("1YpJkwXXDrjJj");
    expect(idResult.ok).toBe(true);
    if (!idResult.ok) return;

    const result = buildJoinUrl(idResult.value);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("https://x.com/i/spaces/1YpJkwXXDrjJj");
    }
  });

  it("contains no extra query parameters", () => {
    const idResult = spaceIdFromString("1ABCDEFGhij");
    expect(idResult.ok).toBe(true);
    if (!idResult.ok) return;

    const result = buildJoinUrl(idResult.value);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("https://x.com/i/spaces/1ABCDEFGhij");
      expect(result.value.includes("?")).toBe(false);
      expect(result.value.includes("&")).toBe(false);
    }
  });
});
