/**
 * JSON body for GET /api/spaces.
 *
 * Intended logic: Dates become ISO-8601 strings; branded ids become plain
 * strings; topic tags stay arrays. Keep field names aligned with
 * `DirectorySnapshot` so the UI can share types later via a generated client.
 * Host fields and recentlySharedCards are absent in MVP.
 */

import { notImplementedYet } from "@/domain/result";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpacesError } from "@/domain/errors";
import type { Result } from "@/domain/result";

export type SerializedDirectorySnapshot = {
  readonly generatedAt: string;
  readonly liveCount: number;
  readonly appliedFilters: {
    readonly keywordQuery: string;
    readonly liveOnly: boolean;
    readonly minimumListenerCount: number;
    readonly languageCode: string | null;
  };
  readonly visibleCards: readonly SerializedLiveSpaceCard[];
};

export type SerializedLiveSpaceCard = {
  readonly spaceId: string;
  readonly title: string;
  readonly listenerCount: number;
  readonly topicTags: readonly string[];
  readonly languageCode: string | null;
  readonly lifecycleState: "live" | "scheduled" | "ended";
  readonly startedAt: string | null;
  readonly scheduledStart: string | null;
  readonly joinUrl: string;
  readonly sourceKind: "official-api";
};

export function serializeDirectorySnapshot(
  snapshot: DirectorySnapshot,
): Result<SerializedDirectorySnapshot, LiveSpacesError> {
  void snapshot;
  return notImplementedYet("serializeDirectorySnapshot");
}
