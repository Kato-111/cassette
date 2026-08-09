import { describe, expect, it } from "vitest";
import { gradientFromSeed } from "@/lib/seed-gradient";

describe("gradientFromSeed", () => {
  it("returns the same gradient for the same seed", () => {
    const a = gradientFromSeed("Chill Vibes");
    const b = gradientFromSeed("Chill Vibes");
    expect(a).toEqual(b);
  });

  it("is case-insensitive and trims whitespace", () => {
    const a = gradientFromSeed("  Summer Hits  ");
    const b = gradientFromSeed("summer hits");
    expect(a).toEqual(b);
  });

  it("returns different gradients for different seeds", () => {
    const a = gradientFromSeed("Playlist 1");
    const b = gradientFromSeed("Playlist 2");
    expect(a.backgroundImage).not.toBe(b.backgroundImage);
  });

  it("returns a layered gradient with hsl colors", () => {
    const { backgroundImage, color } = gradientFromSeed("My Playlist");
    expect(backgroundImage).toContain("linear-gradient(");
    expect(backgroundImage).toContain("radial-gradient(");
    expect(backgroundImage).toContain("hsl(");
    expect(color).toContain("hsl(");
  });
});
