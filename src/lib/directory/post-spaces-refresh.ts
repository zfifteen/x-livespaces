/**
 * Browser POST to /api/spaces/refresh. Inject fetch in tests — never live X.
 */

import { err, ok, type Result } from "@/domain/result";

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
        "Couldn't refresh the directory. Try again in a few minutes.",
      ),
    });
  } catch {
    return err({
      status: undefined,
      message: "Couldn't refresh the directory. Check your connection and try again.",
    });
  }
}
