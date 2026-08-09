import { describe, expect, it } from "vitest";
import {
  parseSpotdlSaveFile,
  spotdlSongToImportItem,
  type SpotdlSong,
} from "../src/importers/spotdl-runner.ts";

const sampleSong: SpotdlSong = {
  name: "Blinding Lights",
  artists: ["The Weeknd"],
  artist: "The Weeknd",
  album_name: "After Hours",
  duration: 200,
  song_id: "0VjIjW4GlUZAMYd2vXMi3b",
  url: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
  cover_url: "https://i.scdn.co/image/example.jpg",
};

describe("spotdl save parsing", () => {
  it("maps a spotdl song to ImportItem", () => {
    expect(spotdlSongToImportItem(sampleSong)).toEqual({
      sourceItemId: "0VjIjW4GlUZAMYd2vXMi3b",
      title: "Blinding Lights",
      artist: "The Weeknd",
      album: "After Hours",
      durationSec: 200,
      sourceUrl: "https://open.spotify.com/track/0VjIjW4GlUZAMYd2vXMi3b",
      thumbnailUrl: "https://i.scdn.co/image/example.jpg",
    });
  });

  it("parses a spotdl save file", () => {
    const items = parseSpotdlSaveFile(JSON.stringify([sampleSong]));
    expect(items).toHaveLength(1);
    expect(items[0]?.sourceItemId).toBe("0VjIjW4GlUZAMYd2vXMi3b");
  });

  it("skips entries without song_id", () => {
    const items = parseSpotdlSaveFile(
      JSON.stringify([sampleSong, { ...sampleSong, song_id: "" }]),
    );
    expect(items).toHaveLength(1);
  });

  it("rejects invalid save files", () => {
    expect(() => parseSpotdlSaveFile("{}")).toThrow(/song list/);
  });
});
