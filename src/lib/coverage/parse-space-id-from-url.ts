/**
 * Pull a SpaceId out of a public Space URL.
 *
 * Accepted shapes (path `/i/spaces/{id}`):
 * - https://x.com/i/spaces/{id}
 * - https://twitter.com/i/spaces/{id}
 * - the same paths with query strings (`?s=20`) or trailing slashes
 *
 * Intended logic:
 * 1. Trim the raw string.
 * 2. Try `URL` parse; if it has no scheme, retry with `https://` prefixed.
 * 3. Require hostname `x.com`, `www.x.com`, `twitter.com`, or `www.twitter.com`.
 * 4. Match pathname `/i/spaces/{id}` (ignore extra trailing slash).
 * 5. Hand `{id}` to `spaceIdFromString`.
 *
 * Failure: `invalid-space-url` for anything else (status pages, profile URLs).
 */

import { notImplementedYet } from "@/domain/result";
import type { SpaceId } from "@/domain/branded-ids";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export function parseSpaceIdFromUrl(rawUrl: string): Result<SpaceId, LiveSpacesError> {
  void rawUrl;
  return notImplementedYet("parseSpaceIdFromUrl");
}
