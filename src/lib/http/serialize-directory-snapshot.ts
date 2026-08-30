/**
 * JSON body for GET /api/spaces.
 *
 * Intended logic: Dates become ISO-8601 strings; branded ids become plain
 * strings; topic tags stay arrays; optional coverage and language/date nulls
 * match the public contract. Host fields and recentlySharedCards are absent
 * in MVP.
 */

import { ok } from "@/domain/result";
import type { DirectorySnapshot } from "@/domain/directory-snapshot";
import type { LiveSpaceCard } from "@/domain/live-space-card";
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
  readonly coverage?: "official-search" | "cached-after-failure";
  readonly stale?: boolean;
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

function serializeCard(card: LiveSpaceCard): SerializedLiveSpaceCard {
  return {
    spaceId: card.spaceId,
    title: card.title,
    listenerCount: card.listenerCount,
    topicTags: card.topicTags,
    languageCode: card.languageCode ?? null,
    lifecycleState: card.lifecycleState,
    startedAt: card.startedAt ? card.startedAt.toISOString() : null,
    scheduledStart: card.scheduledStart
      ? card.scheduledStart.toISOString()
      : null,
    joinUrl: card.joinUrl,
    sourceKind: card.sourceKind,
  };
}

export function serializeDirectorySnapshot(
  snapshot: DirectorySnapshot,
): Result<SerializedDirectorySnapshot, LiveSpacesError> {
  const body: SerializedDirectorySnapshot = {
    generatedAt: snapshot.generatedAt.toISOString(),
    liveCount: snapshot.liveCount,
    appliedFilters: {
      keywordQuery: snapshot.appliedFilters.keywordQuery,
      liveOnly: snapshot.appliedFilters.liveOnly,
      minimumListenerCount: snapshot.appliedFilters.minimumListenerCount,
      languageCode: snapshot.appliedFilters.languageCode ?? null,
    },
    visibleCards: snapshot.visibleCards.map(serializeCard),
  };

  if (snapshot.coverage !== undefined) {
    return ok({
      ...body,
      coverage: snapshot.coverage,
    });
  }

  return ok(body);
}
