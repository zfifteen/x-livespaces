/**
 * Map domain errors onto HTTP status codes for Route Handlers.
 *
 * Intended mapping:
 * - not-implemented → 501
 * - invalid-* / invalid-filters → 400
 * - missing-bearer-token → 500 (server misconfig)
 * - unauthorized-refresh → 401
 * - x-api-rate-limited → 429 (forward Retry-After when present)
 * - x-api-unavailable / payload-unreadable → 502
 */

import { describeLiveSpacesError } from "@/domain/errors";
import type { LiveSpacesError } from "@/domain/errors";

export type HttpErrorBody = {
  readonly status: number;
  readonly kind: LiveSpacesError["kind"];
  readonly message: string;
  readonly retryAfterSeconds: number | undefined;
};

export function liveSpacesErrorToHttp(error: LiveSpacesError): HttpErrorBody {
  const message = describeLiveSpacesError(error);
  switch (error.kind) {
    case "not-implemented":
      return { status: 501, kind: error.kind, message, retryAfterSeconds: undefined };
    case "invalid-space-id":
    case "invalid-user-id":
    case "invalid-filters":
      return { status: 400, kind: error.kind, message, retryAfterSeconds: undefined };
    case "missing-bearer-token":
      return { status: 500, kind: error.kind, message, retryAfterSeconds: undefined };
    case "unauthorized-refresh":
      return { status: 401, kind: error.kind, message, retryAfterSeconds: undefined };
    case "x-api-rate-limited":
      return {
        status: 429,
        kind: error.kind,
        message,
        retryAfterSeconds: error.retryAfterSeconds,
      };
    case "x-api-unavailable":
    case "x-api-payload-unreadable":
      return { status: 502, kind: error.kind, message, retryAfterSeconds: undefined };
  }
}
