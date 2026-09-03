import { describe, expect, it, vi } from "vitest";
import {
  buildSpacesLookupPathAndQuery,
  lookupSpacesById,
  type LookupSpacesByIdRequest,
} from "@/lib/x-api/lookup-spaces-by-id";
import { OFFICIAL_X_API_ORIGIN } from "@/lib/x-api/official-x-api-client";
import { spaceIdFromString } from "@/domain/branded-ids";
import type { SpaceId } from "@/domain/branded-ids";

type FetchFn = typeof fetch;

function spaceId(raw: string): SpaceId {
  const result = spaceIdFromString(raw);
  if (!result.ok) {
    throw new Error(`fixture space id invalid: ${raw}`);
  }
  return result.value;
}

function request(
  overrides: Partial<LookupSpacesByIdRequest> = {},
): LookupSpacesByIdRequest {
  return {
    bearerToken: "test-bearer",
    spaceIds: [spaceId("1YpJkwXXDrjJj")],
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

const SECOND_ROW = {
  id: "1ABCDEFGhij",
  state: "scheduled",
  title: "Upcoming AMA",
  participant_count: 0,
  lang: "es",
  started_at: null,
  scheduled_start: "2026-08-21T18:00:00.000Z",
};

const BAD_ROW = {
  id: "bad",
  state: "live",
  // missing title and participant_count
};

describe("buildSpacesLookupPathAndQuery", () => {
  it("builds /spaces with comma-separated ids and space.fields, no expansions", () => {
    const path = buildSpacesLookupPathAndQuery([
      spaceId("1YpJkwXXDrjJj"),
      spaceId("1ABCDEFGhij"),
    ]);
    expect(path.startsWith("/spaces?")).toBe(true);
    const qs = new URLSearchParams(path.slice(path.indexOf("?") + 1));
    expect(qs.get("ids")).toBe("1YpJkwXXDrjJj,1ABCDEFGhij");
    expect(qs.get("space.fields")).toBe(
      "title,participant_count,started_at,scheduled_start,lang,state",
    );
    expect(qs.has("expansions")).toBe(false);
    expect(qs.has("user.fields")).toBe(false);
  });
});

describe("lookupSpacesById", () => {
  it("returns mapped cards on success and uses correct URL", async () => {
    const payload = { data: [LIVE_ROW] };
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, payload));

    const result = await lookupSpacesById(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.spaceId).toBe("1YpJkwXXDrjJj");
    expect(result.value[0]!.title).toBe("Building in public");
    expect(result.value[0]!.listenerCount).toBe(128);
    expect(result.value[0]!.sourceKind).toBe("official-api");
    expect(result.value[0]!.joinUrl).toBe(
      "https://x.com/i/spaces/1YpJkwXXDrjJj",
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0]!;
    const url = call[0] as string;
    const init = call[1];
    expect(url).toBe(
      `${OFFICIAL_X_API_ORIGIN}/2/spaces?ids=1YpJkwXXDrjJj&space.fields=title%2Cparticipant_count%2Cstarted_at%2Cscheduled_start%2Clang%2Cstate`,
    );
    expect(init).toMatchObject({
      method: "GET",
      headers: { Authorization: "Bearer test-bearer" },
    });
  });

  it("returns empty array without calling fetch when spaceIds is empty", async () => {
    const fetchMock = vi.fn<FetchFn>();
    const result = await lookupSpacesById(
      request({ spaceIds: [] }),
      fetchMock,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns empty array when data is omitted (all ids missing / ended)", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, { meta: { result_count: 0 } }));

    const result = await lookupSpacesById(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("drops unreadable rows and keeps valid ones", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, { data: [LIVE_ROW, BAD_ROW] }));

    const result = await lookupSpacesById(request(), fetchMock);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.spaceId).toBe("1YpJkwXXDrjJj");
  });

  it("maps multiple returned rows", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(jsonResponse(200, { data: [LIVE_ROW, SECOND_ROW] }));

    const result = await lookupSpacesById(
      request({
        spaceIds: [spaceId("1YpJkwXXDrjJj"), spaceId("1ABCDEFGhij")],
      }),
      fetchMock,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value.map((c) => c.spaceId)).toEqual([
      "1YpJkwXXDrjJj",
      "1ABCDEFGhij",
    ]);
  });

  it("propagates x-api-rate-limited from the client", async () => {
    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValue(
        jsonResponse(429, { title: "Too Many Requests" }, { "Retry-After": "30" }),
      );

    const result = await lookupSpacesById(request(), fetchMock);

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
    const result = await lookupSpacesById(
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

    const result = await lookupSpacesById(request(), fetchMock);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("x-api-payload-unreadable");
    }
  });

  it("chunks ids above the per-request limit and merges results", async () => {
    // Build 101 distinct valid-looking ids so chunking is forced (limit 100).
    const manyIds: SpaceId[] = [];
    for (let i = 0; i < 101; i++) {
      manyIds.push(spaceId(`1ChunkId${String(i).padStart(3, "0")}`));
    }

    const firstChunkRows = manyIds.slice(0, 100).map((id) => ({
      id,
      state: "live",
      title: `Space ${id}`,
      participant_count: 1,
    }));
    const secondChunkRows = manyIds.slice(100).map((id) => ({
      id,
      state: "live",
      title: `Space ${id}`,
      participant_count: 2,
    }));

    const fetchMock = vi
      .fn<FetchFn>()
      .mockResolvedValueOnce(jsonResponse(200, { data: firstChunkRows }))
      .mockResolvedValueOnce(jsonResponse(200, { data: secondChunkRows }));

    const result = await lookupSpacesById(
      request({ spaceIds: manyIds }),
      fetchMock,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(101);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstUrl = fetchMock.mock.calls[0]![0] as string;
    const secondUrl = fetchMock.mock.calls[1]![0] as string;
    expect(firstUrl).toContain("ids=");
    expect(secondUrl).toContain("ids=");
    // Second call should contain only the remaining id.
    expect(secondUrl).toContain("1ChunkId100");
  });
});
