import { describe, expect, it } from "vitest";
import {
  cleanImportTitle,
  youtubeMusicSongsToItems,
} from "../src/importers/youtube.ts";

describe("cleanImportTitle", () => {
  it("removes parenthetical YouTube suffixes", () => {
    expect(cleanImportTitle("Without Me (Official Music Video)")).toBe(
      "Without Me",
    );
    expect(cleanImportTitle("Mockingbird (Lyrics)")).toBe("Mockingbird");
    expect(cleanImportTitle("Lose Yourself (Official Video) (HD)")).toBe(
      "Lose Yourself",
    );
  });

  it("leaves titles without parentheses unchanged", () => {
    expect(cleanImportTitle("Stan")).toBe("Stan");
    expect(cleanImportTitle("  The Real Slim Shady  ")).toBe(
      "The Real Slim Shady",
    );
  });

  it("returns Untitled for empty input", () => {
    expect(cleanImportTitle("")).toBe("Untitled");
    expect(cleanImportTitle("   ")).toBe("Untitled");
  });
});

describe("youtubeMusicSongsToItems", () => {
  it("keeps only song results and returns normalized metadata", () => {
    const results = youtubeMusicSongsToItems(
      [
        {
          id: "abc123",
          item_type: "song",
          title: "Song Name (Official Video)",
          artists: [{ name: "Artist Name" }, { name: "Featured Artist" }],
          album: { name: "An Album" },
          duration: { seconds: 185 },
          thumbnails: [{ url: "https://img.example/thumb.jpg" }],
        },
        { id: "not-a-song", item_type: "video", title: "Music video" },
        { item_type: "song", title: "Unavailable result" },
      ],
      10,
    );

    expect(results).toEqual([
      {
        sourceItemId: "abc123",
        title: "Song Name",
        artist: "Artist Name, Featured Artist",
        album: "An Album",
        durationSec: 185,
        sourceUrl: "https://www.youtube.com/watch?v=abc123",
        thumbnailUrl: "https://img.example/thumb.jpg",
      },
    ]);
  });

  it("does not return more results than requested", () => {
    const results = youtubeMusicSongsToItems(
      [
        { id: "one", item_type: "song", title: "One" },
        { id: "two", item_type: "song", title: "Two" },
      ],
      1,
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.sourceItemId).toBe("one");
  });
});
