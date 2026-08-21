/**
 * Nominal identifier for Spaces.
 *
 * Call the constructor at the trust boundary (API mapping).
 * Downstream code should take `SpaceId` so a raw string cannot
 * silently wander in.
 */

import { notImplementedYet } from "@/domain/result";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type SpaceId = string & { readonly __brand: "SpaceId" };

/**
 * Accept a raw Space id from the X API or a parsed `/i/spaces/{id}` URL.
 *
 * Intended logic:
 * 1. Trim whitespace.
 * 2. Reject empty strings.
 * 3. Keep the official id alphabet (typically starts with `1` and is alphanumeric).
 * 4. Brand the string as `SpaceId`.
 *
 * Failure: `invalid-space-id` with the original raw value in the error.
 */
export function spaceIdFromString(rawValue: string): Result<SpaceId, LiveSpacesError> {
  void rawValue;
  return notImplementedYet("spaceIdFromString");
}
