/**
 * One directory card: title, listeners, topics, duration, Join.
 * Host name/avatar/handle are out of MVP (no User expansions).
 */

import type { LiveSpaceCard } from "@/domain/live-space-card";

type LiveSpaceCardViewProps = {
  readonly card: LiveSpaceCard;
  readonly timingLabel: string;
};

export function LiveSpaceCardView({ card, timingLabel }: LiveSpaceCardViewProps) {
  return (
    <article className="space-card" data-space-id={card.spaceId}>
      <header className="space-card__header">
        <h2 className="space-card__title">{card.title}</h2>
      </header>
      <p className="space-card__listeners">{card.listenerCount} listening</p>
      <ul className="space-card__topics">
        {card.topicTags.map((topicTag) => (
          <li key={topicTag}>{topicTag}</li>
        ))}
      </ul>
      <p className="space-card__timing">{timingLabel}</p>
      <a className="space-card__join" href={card.joinUrl} target="_blank" rel="noopener noreferrer">
        Join Space
      </a>
    </article>
  );
}
