import { describe, expect, it } from "vitest";
import { err, notImplementedYet, ok } from "@/domain/result";

describe("Result helpers", () => {
  it("wraps a successful value", () => {
    const result = ok(7);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(7);
    }
  });

  it("wraps a failure", () => {
    const result = err("nope");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("nope");
    }
  });

  it("marks unimplemented operations", () => {
    const result = notImplementedYet("example");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual({ kind: "not-implemented", operationName: "example" });
    }
  });
});
