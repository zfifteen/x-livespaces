import { describe, expect, it } from "vitest";
import {
  JOIN_BEACON_PATH,
  fireJoinBeaconThen,
  sendJoinBeacon,
} from "@/lib/analytics/send-join-beacon";

describe("sendJoinBeacon", () => {
  it("posts a JSON blob to the join endpoint before after() runs", () => {
    const calls: string[] = [];
    const sendBeacon: typeof navigator.sendBeacon = (url, data) => {
      calls.push("beacon");
      expect(url).toBe(JOIN_BEACON_PATH);
      expect(data).toBeInstanceOf(Blob);
      expect((data as Blob).type).toBe("application/json");
      return true;
    };
    fireJoinBeaconThen("1YpJkwXXDrjJj", sendBeacon, () => {
      calls.push("navigate");
    });
    expect(calls).toEqual(["beacon", "navigate"]);
  });

  it("does not throw when sendBeacon is missing", () => {
    expect(() => sendJoinBeacon("1YpJkwXXDrjJj", undefined)).not.toThrow();
  });
});
