import { describe, expect, it, vi } from "vitest";
import {
  getOfficialXApiJson,
  OFFICIAL_X_API_ORIGIN,
  type OfficialXApiGetRequest,
} from "@/lib/x-api/official-x-api-client";

type FetchFn = typeof fetch;

function request(
  overrides: Partial<OfficialXApiGetRequest> = {},
): OfficialXApiGetRequest {
  return {
    bearerToken: "test-bearer",
    pathAndQuery: "/spaces/search?query=a&state=live",
    ...overrides,
  };
}

function jsonResponse(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

describe("getOfficialXApiJson", () => {
  it("returns parsed JSON on 200", async () => {
    const payload = { data: [{ id: "1YpJk" }] };
    const fetchMock = vi.fn<FetchFn>().mockResolvedValue(jsonResponse(200, payload));

    const result = await getOfficialXApiJson(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(payload);
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      `${OFFICIAL_X_API_ORIGIN}/2/spaces/search?query=a&state=live`,
    );
    expect(init).toMatchObject({
      method: "GET",
      headers: {
        Authorization: "Bearer test-bearer",
      },
    });
  });

  it("fails with missing-bearer-token when bearer is empty", async () => {
    const fetchMock = vi.fn<FetchFn>();
    const result = await getOfficialXApiJson(
      request({ bearerToken: "   " }),
      fetchMock,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("missing-bearer-token");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps 429 to x-api-rate-limited and parses Retry-After", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(
        jsonResponse(429, { title: "Too Many Requests" }, { "Retry-After": "42" }),
      );

    const result = await getOfficialXApiJson(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-rate-limited");
      if (result.error.kind === "x-api-rate-limited") {
        expect(result.error.retryAfterSeconds).toBe(42);
      }
    }
  });

  it("maps 429 without Retry-After to undefined retry", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(429, { title: "Too Many Requests" }));

    const result = await getOfficialXApiJson(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok && result.error.kind === "x-api-rate-limited") {
      expect(result.error.retryAfterSeconds).toBeUndefined();
    }
  });

  it("maps 401, 403, and 5xx to x-api-unavailable", async () => {
    for (const status of [401, 403, 500, 502, 503]) {
      const fetchMock = vi
        .fn<FetchFn>()
        .mockResolvedValue(jsonResponse(status, { title: "error" }));

      const result = await getOfficialXApiJson(request(), fetchMock);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.kind).toBe("x-api-unavailable");
        if (result.error.kind === "x-api-unavailable") {
          expect(result.error.httpStatus).toBe(status);
        }
      }
    }
  });

  it("maps non-JSON body to x-api-payload-unreadable", async () => {
    const fetchMock = vi.fn<FetchFn>().mockResolvedValue(
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const result = await getOfficialXApiJson(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("maps network-level fetch rejection to x-api-unavailable", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockRejectedValue(new TypeError("network down"));

    const result = await getOfficialXApiJson(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-unavailable");
      if (result.error.kind === "x-api-unavailable") {
        expect(result.error.httpStatus).toBeUndefined();
      }
    }
  });
});
