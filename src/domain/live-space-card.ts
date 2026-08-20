import type { SpaceId } from "@/domain/branded-ids";
import type { HostIdentity } from "@/domain/host-identity";

/**
 * How this Space entered the directory.
 *
 * `official-api` — `/2/spaces/search` or `/2/spaces/:id`.
 * `public-post-link` — harvested from a public post that contained an `/i/spaces/` URL.
 * `merged` — the same SpaceId appeared in both sources; keep official fields and mark merged.
 */
export type DirectorySourceKind = "official-api" | "public-post-link" | "merged";

export type SpaceLifecycleState = "live" | "scheduled" | "ended";

/**
 * One row in the public directory. This is the UI card contract from CONCEPT §4.
 */
export type LiveSpaceCard = {
  readonly spaceId: SpaceId;
  readonly title: string;
  readonly host: HostIdentity;
  readonly listenerCount: number;
  readonly topicTags: readonly string[];
  readonly languageCode: string | undefined;
  readonly lifecycleState: SpaceLifecycleState;
  readonly startedAt: Date | undefined;
  readonly scheduledStart: Date | undefined;
  readonly joinUrl: string;
  readonly sourceKind: DirectorySourceKind;
};
