import { describe, expect, it } from "vitest";
import { mergeImportItemMetadata } from "../src/importers/youtube.ts";

describe("mergeImportItemMetadata", () => {
  const baseItem = {
    sourceItemId: "abc123",
    title: "Flat Title",
    artist: "Flat Artist",
    durationSec: 200,
    sourceUrl: "https://www.youtube.com/watch?v=abc123",
  };

  it("prefers full yt-dlp album over playlist fallback on item", () => {
    const merged = mergeImportItemMetadata(
      { ...baseItem, album: "Wrong Playlist Name" },
      { album: "The Eminem Show", artist: "Eminem", title: "Without Me" },
    );
    expect(merged.album).toBe("The Eminem Show");
    expect(merged.artist).toBe("Eminem");
    expect(merged.title).toBe("Without Me");
  });

  it("keeps playlist album when full metadata has none", () => {
    const merged = mergeImportItemMetadata(
      { ...baseItem, album: "Greatest Hits" },
      { title: "Song", uploader: "Artist" },
    );
    expect(merged.album).toBe("Greatest Hits");
  });

  it("fills album from full metadata when item had none", () => {
    const merged = mergeImportItemMetadata(baseItem, {
      album: "Curtain Call",
      title: "Mockingbird",
      artist: "Eminem",
    });
    expect(merged.album).toBe("Curtain Call");
  });
});
