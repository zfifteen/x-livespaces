/**
 * Rail of Spaces discovered from public posts (CONCEPT §4 recently shared).
 */

import { LiveSpaceCardView } from "@/components/directory/LiveSpaceCardView";
import type { LiveSpaceCard } from "@/domain/live-space-card";

type RecentlySharedSpacesProps = {
  readonly cards: readonly LiveSpaceCard[];
};

export function RecentlySharedSpaces({ cards }: RecentlySharedSpacesProps) {
  return (
    <section className="recently-shared" aria-label="Recently shared Spaces">
      <h2>Recently shared</h2>
      {cards.length === 0 ? (
        <p>Public-link harvest will fill this rail in Phase 3.</p>
      ) : (
        <div className="recently-shared__list">
          {cards.map((card) => (
            <LiveSpaceCardView key={card.spaceId} card={card} timingLabel="Timing pending" />
          ))}
        </div>
      )}
    </section>
  );
}
