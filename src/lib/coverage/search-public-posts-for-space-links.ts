/**
 * Supplementary coverage: find Space URLs in public posts.
 *
 * CONCEPT §6 source 2. Query recent search with `filter:spaces` and/or
 * `url:x.com/i/spaces`, then parse each expanded URL.
 *
 * Intended logic:
 * 1. GET `/2/tweets/search/recent` with a conservative query and `max_results`
 *    small enough for the poll budget.
 * 2. Collect `entities.urls.expanded_url` (and `text` as fallback).
 * 3. Run `parseSpaceIdFromUrl` on each; drop misses.
 * 4. Deduplicate SpaceIds.
 * 5. Return ids only — `lookupSpacesById` enriches them so cards stay consistent.
 *
 * Legal/ToS: public recent search via the official API, no private timelines.
 */

import { notImplementedYet } from "@/domain/result";
import type { SpaceId } from "@/domain/branded-ids";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type SearchPublicPostsForSpaceLinksRequest = {
  readonly bearerToken: string;
};

export function searchPublicPostsForSpaceLinks(
  request: SearchPublicPostsForSpaceLinksRequest,
): Promise<Result<readonly SpaceId[], LiveSpacesError>> {
  void request;
  return Promise.resolve(notImplementedYet("searchPublicPostsForSpaceLinks"));
}
