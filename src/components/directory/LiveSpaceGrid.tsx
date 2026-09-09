/**
 * Card grid for the current filter set.
 */

import { LiveSpaceCardView } from "@/components/directory/LiveSpaceCardView";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { EMPTY_SNAPSHOT_COPY } from "@/lib/seo/live-spaces-metadata";

type LiveSpaceGridProps = {
  readonly cards: readonly LiveSpaceCard[];
};

export function LiveSpaceGrid({ cards }: LiveSpaceGridProps) {
  if (cards.length === 0) {
    return (
      <p className="space-grid__empty" role="status">
        {EMPTY_SNAPSHOT_COPY}
      </p>
    );
  }

  return (
    <div className="space-grid">
      {cards.map((card) => (
        <LiveSpaceCardView key={card.spaceId} card={card} timingLabel="Timing pending" />
      ))}
    </div>
  );
}
