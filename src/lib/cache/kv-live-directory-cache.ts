/**
 * Cloudflare KV adapter for LiveDirectoryCache.
 *
 * Binding name LIVE_DIRECTORY, key snapshot:v1. Soft TTL is generatedAt
 * (snapshotIsFresh) — never KV expirationTtl. Separate from any OpenNext ISR
 * namespace (do not invent namespace IDs here).
 */

import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import { err, ok, type Result } from "@/domain/result";
import type { LiveDirectoryCache } from "@/lib/cache/live-directory-cache";
import type { KvNamespaceLike } from "@/lib/cache/kv-namespace";
import { parseDirectorySnapshotJson } from "@/lib/cache/parse-directory-snapshot-json";
import { serializeDirectorySnapshot } from "@/lib/http/serialize-directory-snapshot";

export const LIVE_DIRECTORY_SNAPSHOT_KEY = "snapshot:v1";
export const KV_MAX_VALUE_BYTES = 25 * 1024 * 1024;

function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function createKvLiveDirectoryCache(
  namespace: KvNamespaceLike,
): LiveDirectoryCache {
  return {
    readSnapshot: async (): Promise<
      Result<DirectorySnapshot | undefined, LiveSpacesError>
    > => {
      let raw: string | null;
      try {
        raw = await namespace.get(LIVE_DIRECTORY_SNAPSHOT_KEY);
      } catch {
        return err({
          kind: "x-api-payload-unreadable",
          message: "KV snapshot read failed",
        });
      }
      if (raw === null) {
        return ok(undefined);
      }
      return parseDirectorySnapshotJson(raw);
    },
    writeSnapshot: async (
      snapshot: DirectorySnapshot,
    ): Promise<Result<void, LiveSpacesError>> => {
      const serialized = serializeDirectorySnapshot(snapshot);
      if (!serialized.ok) {
        return serialized;
      }
      const raw = JSON.stringify(serialized.value);
      if (utf8ByteLength(raw) > KV_MAX_VALUE_BYTES) {
        return err({
          kind: "x-api-payload-unreadable",
          message: "KV snapshot exceeds 25 MiB",
        });
      }
      try {
        await namespace.put(LIVE_DIRECTORY_SNAPSHOT_KEY, raw);
      } catch {
        return err({
          kind: "x-api-payload-unreadable",
          message: "KV snapshot write failed",
        });
      }
      return ok(undefined);
    },
  };
}
