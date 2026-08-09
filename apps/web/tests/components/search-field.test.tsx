import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { replaceMock } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

import { SearchField } from "@/app/_components/search-field";

describe("SearchField", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("debounces router.replace when typing", () => {
    render(<SearchField basePath="/" />);
    fireEvent.change(screen.getByLabelText("Search tracks"), {
      target: { value: "jazz" },
    });

    expect(replaceMock).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(replaceMock).toHaveBeenCalledWith("/?q=jazz");
  });

  it("clear button resets value and navigates to basePath", () => {
    render(<SearchField value="rock" basePath="/" />);
    fireEvent.click(screen.getByLabelText("Clear search"));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(replaceMock).toHaveBeenCalledWith("/");
  });

  it("preserves playlist base path", () => {
    render(<SearchField value="" basePath="/p/abc123" />);
    fireEvent.change(screen.getByLabelText("Search tracks"), {
      target: { value: "test" },
    });
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(replaceMock).toHaveBeenCalledWith("/p/abc123?q=test");
  });
});
