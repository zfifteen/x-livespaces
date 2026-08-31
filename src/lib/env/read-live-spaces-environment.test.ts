import { describe, expect, it } from "vitest";
import { readLiveSpacesEnvironment } from "@/lib/env/read-live-spaces-environment";

function env(
  values: Record<string, string | undefined>,
): NodeJS.ProcessEnv {
  return values as NodeJS.ProcessEnv;
}

describe("readLiveSpacesEnvironment", () => {
  it("returns bearer and default cooldown 1800 when only bearer is set", () => {
    const result = readLiveSpacesEnvironment(
      env({
        X_API_BEARER_TOKEN: "test-bearer-token",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.xApiBearerToken).toBe("test-bearer-token");
      expect(result.value.refreshCooldownSeconds).toBe(1800);
    }
  });

  it("uses REFRESH_COOLDOWN_SECONDS when it is a positive integer", () => {
    const result = readLiveSpacesEnvironment(
      env({
        X_API_BEARER_TOKEN: "tok",
        REFRESH_COOLDOWN_SECONDS: "900",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.xApiBearerToken).toBe("tok");
      expect(result.value.refreshCooldownSeconds).toBe(900);
    }
  });

  it("fails with missing-bearer-token when bearer is absent", () => {
    const result = readLiveSpacesEnvironment(env({}));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("missing-bearer-token");
    }
  });

  it("fails with missing-bearer-token when bearer is empty or whitespace", () => {
    const empty = readLiveSpacesEnvironment(env({ X_API_BEARER_TOKEN: "" }));
    expect(empty.ok).toBe(false);
    if (!empty.ok) {
      expect(empty.error.kind).toBe("missing-bearer-token");
    }

    const whitespace = readLiveSpacesEnvironment(
      env({ X_API_BEARER_TOKEN: "   " }),
    );
    expect(whitespace.ok).toBe(false);
    if (!whitespace.ok) {
      expect(whitespace.error.kind).toBe("missing-bearer-token");
    }
  });

  it("fails when REFRESH_COOLDOWN_SECONDS is not a positive integer", () => {
    const cases = ["0", "-30", "1.5", "abc", ""];
    for (const value of cases) {
      const result = readLiveSpacesEnvironment(
        env({
          X_API_BEARER_TOKEN: "tok",
          REFRESH_COOLDOWN_SECONDS: value,
        }),
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("missing-bearer-token");
      }
    }
  });

  it("trims the bearer token", () => {
    const result = readLiveSpacesEnvironment(
      env({
        X_API_BEARER_TOKEN: "  padded-token  ",
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.xApiBearerToken).toBe("padded-token");
    }
  });
});
