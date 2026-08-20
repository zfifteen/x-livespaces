import { describe, expect, it } from "vitest";
import { liveSpacesErrorToHttp } from "@/lib/http/live-spaces-error-to-http";

describe("liveSpacesErrorToHttp", () => {
  it("maps not-implemented to 501", () => {
    const http = liveSpacesErrorToHttp({
      kind: "not-implemented",
      operationName: "GET /api/spaces",
    });
    expect(http.status).toBe(501);
    expect(http.kind).toBe("not-implemented");
  });

  it("maps invalid filters to 400", () => {
    const http = liveSpacesErrorToHttp({
      kind: "invalid-filters",
      message: "minListeners must be a non-negative integer",
    });
    expect(http.status).toBe(400);
  });

  it("maps rate limits to 429", () => {
    const http = liveSpacesErrorToHttp({
      kind: "x-api-rate-limited",
      retryAfterSeconds: 12,
      message: "rate limited",
    });
    expect(http.status).toBe(429);
    expect(http.retryAfterSeconds).toBe(12);
  });
});
