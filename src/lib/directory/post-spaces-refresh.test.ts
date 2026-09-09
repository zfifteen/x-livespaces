import { describe, expect, it } from "vitest";
import { postSpacesRefresh } from "@/lib/directory/post-spaces-refresh";

describe("postSpacesRefresh", () => {
  it("returns ok on HTTP 200 without calling X itself", async () => {
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(new Response(JSON.stringify({ refreshed: true }), { status: 200 }));
    const result = await postSpacesRefresh(fetchImpl);
    expect(result.ok).toBe(true);
  });

  it("returns a failure message on HTTP 500", async () => {
    const fetchImpl: typeof fetch = () =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            kind: "missing-bearer-token",
            message: "X_API_BEARER_TOKEN is required",
          }),
          { status: 500 },
        ),
      );
    const result = await postSpacesRefresh(fetchImpl);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toBe("X_API_BEARER_TOKEN is required");
    }
  });

  it("returns a failure when fetch rejects", async () => {
    const fetchImpl: typeof fetch = () => Promise.reject(new Error("network down"));
    const result = await postSpacesRefresh(fetchImpl);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });
});
