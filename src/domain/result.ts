/**
 * Explicit success / failure wrapper for expected error paths.
 *
 * Speak the result aloud: "if the result is ok, use the value; otherwise
 * inspect the error kind."
 */

import type { LiveSpacesError } from "@/domain/errors";

export type Result<Value, ErrorValue = LiveSpacesError> =
  { readonly ok: true; readonly value: Value } | { readonly ok: false; readonly error: ErrorValue };

export function ok<Value>(value: Value): Result<Value, never> {
  return { ok: true, value };
}

export function err<ErrorValue>(error: ErrorValue): Result<never, ErrorValue> {
  return { ok: false, error };
}

/**
 * Phase 1 stand-in for every unimplemented domain or library function.
 * Phase 3 replaces each call site with real logic and deletes the helper
 * once nothing remains stubbed.
 */
export function notImplementedYet<Value>(operationName: string): Result<Value, LiveSpacesError> {
  return {
    ok: false,
    error: {
      kind: "not-implemented",
      operationName,
    },
  };
}
