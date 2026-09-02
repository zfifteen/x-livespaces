import { describe, expect, it, vi } from "vitest";
import {
  buildSpacesSearchPathAndQuery,
  searchSpacesByKeyword,
  type SearchSpacesByKeywordRequest,
} from "@/lib/x-api/search-spaces-by-keyword";
import { OFFICIAL_X_API_ORIGIN } from "@/lib/x-api/official-x-api-client";

type FetchFn = typeof fetch;

function request(
  overrides: Partial<SearchSpacesByKeywordRequest> = {},
): SearchSpacesByKeywordRequest {
  return {
    bearerToken: "test-bearer",
    keywordQuery: "a",
    state: "live",
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

const LIVE_ROW = {
  id: "1YpJkwXXDrjJj",
  state: "live",
  title: "Building in public",
  participant_count: 128,
  lang: "en",
  started_at: "2026-08-20T14:30:00.000Z",
  scheduled_start: null,
};

const BAD_ROW = {
  id: "bad",
  state: "live",
  // missing title and participant_count
};

describe("buildSpacesSearchPathAndQuery", () => {
  it("builds query with state=live and required space.fields, no expansions", () => {
    const path = buildSpacesSearchPathAndQuery("crypto", "live");
    expect(path.startsWith("/spaces/search?")).toBe(true);
    const qs = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    expect(qs.get("query")).toBe("crypto");
    expect(qs.get("state")).toBe("live");
    expect(qs.get("space.fields")).toBe(
      "title,participant_count,started_at,scheduled_start,lang,state",
    );
    expect(qs.has("expansions")).toBe(false);
    expect(qs.has("user.fields")).toBe(false);
  });

  it("encodes keyword and accepts scheduled state", () => {
    const path = buildSpacesSearchPathAndQuery("hello world", "scheduled");
    const qs = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    expect(qs.get("query")).toBe("hello world");
    expect(qs.get("state")).toBe("scheduled");
  });
});

describe("searchSpacesByKeyword", () => {
  it("returns mapped cards on success and uses correct URL", async () => {
    const payload = { data: [LIVE_ROW] };
    const fetchMock = vi.fn<FetchFn>().mockResolvedValue(jsonResponse(200, payload));

    const result = await searchSpacesByKeyword(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.spaceId).toBe("1YpJkwXXDrjJj");
    expect(result.value[0]!.title).toBe("Building in public");
    expect(result.value[0]!.listenerCount).toBe(128);
    expect(result.value[0]!.sourceKind).toBe("official-api");
    expect(result.value[0]!.joinUrl).toBe("https://x.com/i/spaces/1YpJkwXXDrjJj");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(
      `${OFFICIAL_X_API_ORIGIN}/2/spaces/search?query=a&state=live&space.fields=title%2Cparticipant_count%2Cstarted_at%2Cscheduled_start%2Clang%2Cstate`,
    );
    expect(init).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer test-bearer" },
    });
  });

  it("rejects empty keyword without calling fetch", async () => {
    const fetchMock = vi.fn<FetchFn>();
    const result = await searchSpacesByKeyword(
      request({ keywordQuery: "   " }),
      fetchMock,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-filters");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty array when data is omitted (zero matches)", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, { meta: { result_count: 0 } }));

    const result = await searchSpacesByKeyword(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("drops unreadable rows and keeps valid ones", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, { data: [LIVE_ROW, BAD_ROW] }));

    const result = await searchSpacesByKeyword(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.spaceId).toBe("1YpJkwXXDrjJj");
  });

  it("propagates x-api-rate-limited from the client", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(
        jsonResponse(429, { title: "Too Many Requests" }, { "Retry-After": "30" }),
      );

    const result = await searchSpacesByKeyword(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-rate-limited");
      if (result.error.kind === "x-api-rate-limited") {
        expect(result.error.retryAfterSeconds).toBe(30);
      }
    }
  });

  it("propagates missing-bearer-token", async () => {
    const fetchMock = vi.fn<FetchFn>();
    const result = await searchSpacesByKeyword(
      request({ bearerToken: "" }),
      fetchMock,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("missing-bearer-token");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails when data is not an array", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, { data: "not-array" }));

    const result = await searchSpacesByKeyword(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-payload-unreadable");
    }
  });
});
