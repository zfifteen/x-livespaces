"use client";

import type { MouseEvent } from "react";
import { fireJoinBeaconThen } from "@/lib/analytics/send-join-beacon";

type JoinSpaceLinkProps = {
  readonly href: string;
  readonly spaceId: string;
};

export function JoinSpaceLink({ href, spaceId }: JoinSpaceLinkProps) {
  return (
    <a
      className="space-card__join"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        const sendBeacon =
          typeof navigator !== "undefined" ? navigator.sendBeacon.bind(navigator) : undefined;
        fireJoinBeaconThen(spaceId, sendBeacon, () => {
          void event;
        });
      }}
    >
      Join Space
    </a>
  );
}
