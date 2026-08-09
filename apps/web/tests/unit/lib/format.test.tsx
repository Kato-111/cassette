import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { formatDuration, highlightMatch } from "@/lib/format";

describe("formatDuration", () => {
  it("returns 0:00 for zero, negative, and NaN", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(-1)).toBe("0:00");
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });

  it("pads seconds", () => {
    expect(formatDuration(65)).toBe("1:05");
  });

  it("formats long tracks", () => {
    expect(formatDuration(3600)).toBe("60:00");
  });
});

describe("highlightMatch", () => {
  it("returns plain text when query is missing or empty", () => {
    expect(highlightMatch("Hello World", undefined)).toBe("Hello World");
    expect(highlightMatch("Hello World", "")).toBe("Hello World");
    expect(highlightMatch("Hello World", "   ")).toBe("Hello World");
  });

  it("wraps case-insensitive matches in mark", () => {
    const { container } = render(
      <>{highlightMatch("Hello World", "world")}</>,
    );
    const mark = container.querySelector("mark");
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe("World");
  });

  it("does not throw on regex-special characters in query", () => {
    expect(() => highlightMatch("C++ rocks", "C++")).not.toThrow();
    expect(() => highlightMatch("[a] test", "[a]")).not.toThrow();
  });
});
