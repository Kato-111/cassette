import { describe, expect, it } from "vitest";
import { resolveProvider } from "../src/importers/registry.ts";
import { youtubeProvider } from "../src/importers/youtube.ts";

describe("import provider registry", () => {
  it("resolves youtube video URLs", () => {
    const provider = resolveProvider(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(provider.source).toBe("youtube");
  });

  it("resolves youtube playlist URLs", () => {
    const provider = resolveProvider(
      "https://www.youtube.com/playlist?list=PLtest123",
    );
    expect(provider.source).toBe("youtube");
  });

  it("resolves youtu.be URLs", () => {
    const provider = resolveProvider("https://youtu.be/dQw4w9WgXcQ");
    expect(provider.source).toBe("youtube");
  });

  it("resolves spotify playlist URLs", () => {
    const provider = resolveProvider(
      "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    );
    expect(provider.source).toBe("spotify");
  });

  it("rejects unsupported URLs", () => {
    expect(() => resolveProvider("https://example.com/foo")).toThrow(
      /Unsupported import URL/,
    );
  });

  it("youtube provider handles music.youtube.com", () => {
    expect(
      youtubeProvider.canHandle("https://music.youtube.com/watch?v=abc"),
    ).toBe(true);
  });
});
