/**
 * One directory card: title, host + avatar, listeners, topics, duration, Join.
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
        {/* Host avatars are remote (pbs.twimg.com). next/image remotePatterns land in Phase 3. */}
        <img
          className="space-card__avatar"
          src={card.host.avatarUrl}
          alt=""
          width={40}
          height={40}
        />
        <div>
          <h2 className="space-card__title">{card.title}</h2>
          <p className="space-card__host">
            {card.host.displayName} @{card.host.handle}
          </p>
        </div>
      </header>
      <p className="space-card__listeners">{card.listenerCount} listening</p>
      <ul className="space-card__topics">
        {card.topicTags.map((topicTag) => (
          <li key={topicTag}>{topicTag}</li>
        ))}
      </ul>
      <p className="space-card__timing">{timingLabel}</p>
      <a className="space-card__join" href={card.joinUrl}>
        Join Space
      </a>
    </article>
  );
}
