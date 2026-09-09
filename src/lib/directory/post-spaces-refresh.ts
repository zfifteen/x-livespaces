/**
 * Browser POST to /api/spaces/refresh. Inject fetch in tests — never live X.
 */

import { err, ok, type Result } from "@/domain/result";
import {
  REFRESH_HTTP_ERROR_COPY,
  REFRESH_NETWORK_ERROR_COPY,
} from "@/lib/seo/live-spaces-metadata";

export type RefreshPostError = {
  readonly message: string;
  readonly status: number | undefined;
};

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "object" && body !== null && !Array.isArray(body)) {
    const message = (body as Record<string, unknown>)["message"];
    if (typeof message === "string" && message.trim() !== "") {
      return message;
    }
  }
  return fallback;
}

export async function postSpacesRefresh(
  fetchImpl: typeof fetch = fetch,
): Promise<Result<void, RefreshPostError>> {
  try {
    const response = await fetchImpl("/api/spaces/refresh", {
      method: "POST",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      return ok(undefined);
    }
    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      parsed = undefined;
    }
    return err({
      status: response.status,
      message: messageFromBody(
        parsed,
        REFRESH_HTTP_ERROR_COPY,
      ),
    });
  } catch {
    return err({
      status: undefined,
      message: REFRESH_NETWORK_ERROR_COPY,
    });
  }
}
