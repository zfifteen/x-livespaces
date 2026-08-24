import { describe, expect, it } from "vitest";
import { spaceIdFromString } from "@/domain/branded-ids";

describe("spaceIdFromString", () => {
  it("trims and accepts a valid alphanumeric Space id", () => {
    const result = spaceIdFromString("  1ABCDEFGhij  ");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("1ABCDEFGhij");
    }
  });

  it("accepts a typical official id that starts with 1", () => {
    const result = spaceIdFromString("1ABCDEFGhijKLMN");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("1ABCDEFGhijKLMN");
    }
  });

  it("rejects empty string and preserves original input in the error", () => {
    const result = spaceIdFromString("");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-space-id");
      if (result.error.kind === "invalid-space-id") {
        expect(result.error.rawValue).toBe("");
      }
    }
  });

  it("rejects whitespace-only and preserves original input in the error", () => {
    const raw = "   \t  ";
    const result = spaceIdFromString(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-space-id");
      if (result.error.kind === "invalid-space-id") {
        expect(result.error.rawValue).toBe(raw);
      }
    }
  });

  it("rejects punctuation and preserves original input in the error", () => {
    const raw = "1abc-def";
    const result = spaceIdFromString(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-space-id");
      if (result.error.kind === "invalid-space-id") {
        expect(result.error.rawValue).toBe(raw);
      }
    }
  });

  it("rejects malformed values with spaces inside and preserves original", () => {
    const raw = "1abc def";
    const result = spaceIdFromString(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-space-id");
      if (result.error.kind === "invalid-space-id") {
        expect(result.error.rawValue).toBe(raw);
      }
    }
  });
});
