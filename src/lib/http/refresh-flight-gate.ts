/**
 * In-process single-flight for POST /api/spaces/refresh.
 * Concurrent isolates still race; this covers one Worker instance.
 */

export type RefreshFlightGate = {
  readonly tryAcquire: () => boolean;
  readonly release: () => void;
};

export function createRefreshFlightGate(): RefreshFlightGate {
  let locked = false;
  return {
    tryAcquire: (): boolean => {
      if (locked) {
        return false;
      }
      locked = true;
      return true;
    },
    release: (): void => {
      locked = false;
    },
  };
}

export const IN_FLIGHT_RETRY_AFTER_SECONDS = 5;

const defaultRefreshFlightGate = createRefreshFlightGate();

export function getDefaultRefreshFlightGate(): RefreshFlightGate {
  return defaultRefreshFlightGate;
}
