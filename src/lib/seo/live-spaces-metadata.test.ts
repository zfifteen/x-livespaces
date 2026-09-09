import { describe, expect, it } from "vitest";
import {
  EMPTY_SNAPSHOT_COPY,
  liveSpacesMetadata,
} from "@/lib/seo/live-spaces-metadata";

describe("liveSpacesMetadata", () => {
  it("sets title LiveSpaces, index-follow robots, and OG hero tags without census copy", () => {
    expect(liveSpacesMetadata.title).toBe("LiveSpaces");
    expect(liveSpacesMetadata.robots).toEqual({ index: true, follow: true });
    expect(liveSpacesMetadata.openGraph?.title).toBe("LiveSpaces");
    expect(JSON.stringify(liveSpacesMetadata.openGraph)).toContain(
      '"type":"website"',
    );
    const description = liveSpacesMetadata.description ?? "";
    expect(description.toLowerCase()).toContain("broad sample");
    expect(description.toLowerCase()).toContain("not every live space");
    expect(liveSpacesMetadata.openGraph?.description).toBe(description);
  });

  it("keeps empty-state copy as no snapshot plus a broad sample, never a census", () => {
    expect(EMPTY_SNAPSHOT_COPY).toMatch(/^No snapshot yet\./);
    expect(EMPTY_SNAPSHOT_COPY.toLowerCase()).toContain("broad sample");
    expect(EMPTY_SNAPSHOT_COPY.toLowerCase()).not.toContain("every live space");
  });
});
