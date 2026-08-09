import { describe, expect, it } from "vitest";
import {
  DEFAULT_SEARCH_LIMIT,
  parseSearchLimit,
} from "../src/lib/parse-search-limit.ts";

describe("parseSearchLimit", () => {
  it("uses the default when omitted", () => {
    expect(parseSearchLimit(undefined)).toBe(DEFAULT_SEARCH_LIMIT);
    expect(parseSearchLimit("   ")).toBe(DEFAULT_SEARCH_LIMIT);
  });

  it("accepts a bounded positive integer", () => {
    expect(parseSearchLimit("1")).toBe(1);
    expect(parseSearchLimit(" 50 ")).toBe(50);
  });

  it("rejects invalid and excessive values", () => {
    expect(() => parseSearchLimit("0")).toThrow(/positive integer/);
    expect(() => parseSearchLimit("1.5")).toThrow(/positive integer/);
    expect(() => parseSearchLimit("songs")).toThrow(/positive integer/);
    expect(() => parseSearchLimit("51")).toThrow(/cannot exceed 50/);
  });
});
