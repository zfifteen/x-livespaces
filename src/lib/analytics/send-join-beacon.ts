/**
 * Join click beacon. Must run before target=_blank navigation.
 * Body is a JSON Blob — bare strings often arrive malformed.
 */

export const JOIN_BEACON_PATH = "/api/analytics/join";

export type SendBeaconFn = (
  url: string,
  data?: BodyInit | null,
) => boolean;

export function sendJoinBeacon(
  spaceId: string,
  sendBeacon: SendBeaconFn | undefined,
): void {
  if (sendBeacon === undefined) {
    return;
  }
  const body = new Blob([JSON.stringify({ spaceId })], {
    type: "application/json",
  });
  try {
    sendBeacon(JOIN_BEACON_PATH, body);
  } catch {
    // Fire-and-forget: a beacon failure must not block Join.
  }
}

export function fireJoinBeaconThen(
  spaceId: string,
  sendBeacon: SendBeaconFn | undefined,
  after: () => void,
): void {
  sendJoinBeacon(spaceId, sendBeacon);
  after();
}
