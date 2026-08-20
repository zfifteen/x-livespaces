import type { UserId } from "@/domain/branded-ids";

/**
 * The person a card should show as the host: display name, @handle, avatar.
 *
 * Prefer the primary creator (`creator_id`) when the official payload has one.
 * Co-hosts stay available on the card for later UI; MVP shows the primary host.
 */
export type HostIdentity = {
  readonly userId: UserId;
  readonly displayName: string;
  readonly handle: string;
  readonly avatarUrl: string;
};
