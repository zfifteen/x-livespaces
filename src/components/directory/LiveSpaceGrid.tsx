/**
 * Card grid for the current filter set.
 */

import { LiveSpaceCardView } from "@/components/directory/LiveSpaceCardView";
import type { LiveSpaceCard } from "@/domain/live-space-card";

type LiveSpaceGridProps = {
  readonly cards: readonly LiveSpaceCard[];
};

export function LiveSpaceGrid({ cards }: LiveSpaceGridProps) {
  if (cards.length === 0) {
    return (
      <p className="space-grid__empty" role="status">
        No live Spaces in this view yet. The directory skeleton is waiting on Phase 3 data.
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
