import { describe, expect, it } from "vitest";
import { isTypingTarget } from "@/lib/keyboard";

describe("isTypingTarget", () => {
  it("returns true for text inputs and search", () => {
    expect(isTypingTarget(document.createElement("input"))).toBe(true);
    expect(
      isTypingTarget(
        Object.assign(document.createElement("input"), { type: "search" }),
      ),
    ).toBe(true);
    expect(isTypingTarget(document.createElement("textarea"))).toBe(true);
  });

  it("returns false for non-typing inputs", () => {
    expect(
      isTypingTarget(
        Object.assign(document.createElement("input"), { type: "checkbox" }),
      ),
    ).toBe(false);
    expect(
      isTypingTarget(
        Object.assign(document.createElement("input"), { type: "button" }),
      ),
    ).toBe(false);
    expect(
      isTypingTarget(
        Object.assign(document.createElement("input"), {
          type: "text",
          readOnly: true,
        }),
      ),
    ).toBe(false);
  });

  it("returns true for contenteditable and textbox roles", () => {
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    expect(isTypingTarget(editable)).toBe(true);

    const textbox = document.createElement("div");
    textbox.setAttribute("role", "textbox");
    expect(isTypingTarget(textbox)).toBe(true);
  });

  it("returns true when the event target is inside a contenteditable", () => {
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    const span = document.createElement("span");
    editable.appendChild(span);
    expect(isTypingTarget(span)).toBe(true);
  });

  it("returns false for non-elements", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget(document)).toBe(false);
  });
});
