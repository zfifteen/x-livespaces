import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIRECTORY_FILTERS,
  directoryFiltersFromSearchParams,
} from "@/domain/directory-filters";

describe("directoryFiltersFromSearchParams", () => {
  it("returns defaults for empty search params", () => {
    const result = directoryFiltersFromSearchParams(new URLSearchParams());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual(DEFAULT_DIRECTORY_FILTERS);
    }
  });

  it("trims keyword query from q", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("q=%20crypto%20"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.keywordQuery).toBe("crypto");
      expect(result.value.liveOnly).toBe(true);
      expect(result.value.minimumListenerCount).toBe(0);
      expect(result.value.languageCode).toBeUndefined();
    }
  });

  it("treats missing q as empty keyword", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("live=1"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.keywordQuery).toBe("");
    }
  });

  it("uses the last live value (hidden 0 then checkbox 1)", () => {
    const params = new URLSearchParams();
    params.append("live", "0");
    params.append("live", "1");
    const result = directoryFiltersFromSearchParams(params);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.liveOnly).toBe(true);
    }
  });

  it("sets liveOnly false when last live value is 0", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("live=0"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.liveOnly).toBe(false);
    }
  });

  it("treats missing live as liveOnly true", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("q=news"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.liveOnly).toBe(true);
    }
  });

  it("parses non-negative integer minListeners", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("minListeners=42"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.minimumListenerCount).toBe(42);
    }
  });

  it("defaults minListeners to 0 when missing", () => {
    const result = directoryFiltersFromSearchParams(new URLSearchParams());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.minimumListenerCount).toBe(0);
    }
  });

  it("rejects negative minListeners with invalid-filters", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("minListeners=-1"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-filters");
    }
  });

  it("rejects non-integer minListeners with invalid-filters", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("minListeners=3.5"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-filters");
    }
  });

  it("rejects NaN-like minListeners with invalid-filters", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("minListeners=abc"),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe("invalid-filters");
    }
  });

  it("treats missing language as undefined", () => {
    const result = directoryFiltersFromSearchParams(new URLSearchParams());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.languageCode).toBeUndefined();
    }
  });

  it("treats empty lang as undefined", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("lang="),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.languageCode).toBeUndefined();
    }
  });

  it("accepts valid short language codes", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("lang=en"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.languageCode).toBe("en");
    }
  });

  it("accepts ja language code", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("lang=ja"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.languageCode).toBe("ja");
    }
  });

  it("trims language code", () => {
    const result = directoryFiltersFromSearchParams(
      new URLSearchParams("lang=%20en%20"),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.languageCode).toBe("en");
    }
  });
});
