import { describe, expect, it } from "vitest";
import {
  DEFAULT_LIVE_DIRECTORY_KEYWORDS,
  fanOutLiveSpaceKeywords,
} from "@/lib/x-api/fan-out-live-space-keywords";

describe("DEFAULT_LIVE_DIRECTORY_KEYWORDS", () => {
  it("is exactly the five vowels in order", () => {
    expect(DEFAULT_LIVE_DIRECTORY_KEYWORDS).toEqual(["a", "e", "i", "o", "u"]);
  });
});

describe("fanOutLiveSpaceKeywords", () => {
  it("returns the five vowels when no extras are supplied", () => {
    const result = fanOutLiveSpaceKeywords();
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(["a", "e", "i", "o", "u"]);
  });

  it("returns the five vowels for an empty extras array", () => {
    const result = fanOutLiveSpaceKeywords([]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(["a", "e", "i", "o", "u"]);
  });

  it("prepends a visitor keyword before the vowels", () => {
    const result = fanOutLiveSpaceKeywords(["crypto"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(["crypto", "a", "e", "i", "o", "u"]);
  });

  it("prepends multiple extras in the order given", () => {
    const result = fanOutLiveSpaceKeywords(["news", "sports"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(["news", "sports", "a", "e", "i", "o", "u"]);
  });

  it("deduplicates case-insensitively and keeps the first occurrence", () => {
    const result = fanOutLiveSpaceKeywords(["A", "Crypto", "a", "CRYPTO"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // First "A" wins over later "a"; "Crypto" wins over "CRYPTO"; vowels keep their defaults.
    expect(result.value).toEqual(["A", "Crypto", "e", "i", "o", "u"]);
  });

  it("skips blank and whitespace-only keywords", () => {
    const result = fanOutLiveSpaceKeywords(["", "  ", "\t", "live"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(["live", "a", "e", "i", "o", "u"]);
  });

  it("trims keywords before use and dedupe", () => {
    const result = fanOutLiveSpaceKeywords(["  crypto  ", " Crypto"]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual(["crypto", "a", "e", "i", "o", "u"]);
  });
});
