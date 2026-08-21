import type { SpaceId } from "@/domain/branded-ids";

/**
 * How this Space entered the directory.
 *
 * MVP uses official Spaces search only. Host expansions and public-post
 * harvest are out of scope.
 */
export type DirectorySourceKind = "official-api";

export type SpaceLifecycleState = "live" | "scheduled" | "ended";

/**
 * One row in the public directory. UI card contract for MVP (no host).
 */
export type LiveSpaceCard = {
  readonly spaceId: SpaceId;
  readonly title: string;
  readonly listenerCount: number;
  readonly topicTags: readonly string[];
  readonly languageCode: string | undefined;
  readonly lifecycleState: SpaceLifecycleState;
  readonly startedAt: Date | undefined;
  readonly scheduledStart: Date | undefined;
  readonly joinUrl: string;
  readonly sourceKind: DirectorySourceKind;
};
