/**
 * Card grid for the current filter set.
 */

import { LiveSpaceCardView } from "@/components/directory/LiveSpaceCardView";
import type { LiveSpaceCard } from "@/domain/live-space-card";
import { spaceCardTimingLabel } from "@/lib/directory/format-space-timing";
import { EMPTY_SNAPSHOT_COPY } from "@/lib/seo/live-spaces-metadata";

type LiveSpaceGridProps = {
  readonly cards: readonly LiveSpaceCard[];
  readonly now?: Date;
};

export function LiveSpaceGrid({ cards, now }: LiveSpaceGridProps) {
  if (cards.length === 0) {
    return (
      <p className="space-grid__empty" role="status">
        {EMPTY_SNAPSHOT_COPY}
      </p>
    );
  }

  const clock = now ?? new Date();

  return (
    <div className="space-grid">
      {cards.map((card) => (
        <LiveSpaceCardView
          key={card.spaceId}
          card={card}
          timingLabel={spaceCardTimingLabel(card, clock)}
        />
      ))}
    </div>
  );
}
