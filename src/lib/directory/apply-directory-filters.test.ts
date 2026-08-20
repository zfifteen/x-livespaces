import { describe, expect, it } from "vitest";
import { DEFAULT_DIRECTORY_FILTERS } from "@/domain/directory-filters";
import { applyDirectoryFilters } from "@/lib/directory/apply-directory-filters";

describe("applyDirectoryFilters", () => {
  it.todo("keeps only live cards when liveOnly is true");

  it.todo("drops cards below minimumListenerCount");

  it.todo("matches keyword against title, handle, and tags");

  it("returns an empty list while the Phase 1 stub is in place", () => {
    expect(applyDirectoryFilters([], DEFAULT_DIRECTORY_FILTERS)).toEqual([]);
  });
});
