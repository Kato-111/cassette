import { describe, expect, it } from "vitest";
import { parseLimit } from "../src/lib/parse-limit.ts";

describe("parseLimit", () => {
  it("returns null when omitted", () => {
    expect(parseLimit(undefined)).toBeNull();
    expect(parseLimit("")).toBeNull();
    expect(parseLimit("   ")).toBeNull();
  });

  it("parses a positive integer", () => {
    expect(parseLimit("3")).toBe(3);
    expect(parseLimit(" 10 ")).toBe(10);
  });

  it("rejects invalid values", () => {
    expect(() => parseLimit("0")).toThrow(/positive integer/);
    expect(() => parseLimit("-1")).toThrow(/positive integer/);
    expect(() => parseLimit("abc")).toThrow(/positive integer/);
    expect(() => parseLimit("501")).toThrow(/cannot exceed 500/);
  });
});
