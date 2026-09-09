import { describe, expect, it } from "vitest";
import { isUsableWebAnalyticsToken } from "@/components/analytics/CloudflareWebAnalyticsSnippet";

describe("isUsableWebAnalyticsToken", () => {
  it("rejects empty and placeholder values", () => {
    expect(isUsableWebAnalyticsToken(undefined)).toBe(false);
    expect(isUsableWebAnalyticsToken("")).toBe(false);
    expect(isUsableWebAnalyticsToken("REPLACE_ME")).toBe(false);
    expect(isUsableWebAnalyticsToken("placeholder")).toBe(false);
  });

  it("accepts a non-placeholder token shape without embedding one", () => {
    expect(isUsableWebAnalyticsToken("cf-token-from-env")).toBe(true);
  });
});
