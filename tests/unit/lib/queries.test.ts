import type { Track } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { filterTracksByQuery, rankSearchResults } from "@/lib/queries";

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "track-1",
  title: "Alpha Song",
  artist: "Beta Artist",
  album: "Gamma Album",
  durationSec: 180,
  genre: null,
  bpm: null,
  key: null,
  artworkUrl: null,
  storageKey: "audio/test.mp3",
  libraryOrder: 0,
  isLocal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("filterTracksByQuery", () => {
  const tracks = [
    makeTrack({ id: "1", title: "Midnight Run", artist: "Nova" }),
    makeTrack({ id: "2", title: "Sunrise", artist: "Midnight Crew", album: "Dawn" }),
    makeTrack({ id: "3", title: "Static", artist: "Echo", album: "Noise" }),
  ];

  it("returns all tracks for empty query", () => {
    expect(filterTracksByQuery(tracks, "")).toEqual(tracks);
    expect(filterTracksByQuery(tracks, "   ")).toEqual(tracks);
  });

  it("matches title, artist, and album case-insensitively", () => {
    expect(filterTracksByQuery(tracks, "midnight")).toHaveLength(2);
    expect(filterTracksByQuery(tracks, "DAWN")).toHaveLength(1);
    expect(filterTracksByQuery(tracks, "echo")).toHaveLength(1);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterTracksByQuery(tracks, "zzzzz")).toEqual([]);
  });
});

describe("rankSearchResults", () => {
  it("ranks exact title match above longer title prefix match", () => {
    const tracks = [
      makeTrack({ id: "1", title: "Rock and Roll Forever" }),
      makeTrack({ id: "2", title: "Rock" }),
    ];
    const ranked = rankSearchResults(tracks, "rock");
    expect(ranked[0]?.id).toBe("2");
  });

  it("ranks earlier substring position higher", () => {
    const tracks = [
      makeTrack({ id: "1", title: "The Love Song", artist: "A" }),
      makeTrack({ id: "2", title: "Love", artist: "B" }),
    ];
    const ranked = rankSearchResults(tracks, "love");
    expect(ranked[0]?.id).toBe("2");
  });

  it("uses alphabetical title as tie-breaker", () => {
    const tracks = [
      makeTrack({ id: "1", title: "Zebra", artist: "Pop" }),
      makeTrack({ id: "2", title: "Apple", artist: "Pop" }),
    ];
    const ranked = rankSearchResults(tracks, "pop");
    expect(ranked.map((t) => t.title)).toEqual(["Apple", "Zebra"]);
  });

  it("filters out tracks with no match", () => {
    const tracks = [
      makeTrack({ id: "1", title: "Match Me", artist: "A" }),
      makeTrack({ id: "2", title: "Nope", artist: "B" }),
    ];
    const ranked = rankSearchResults(tracks, "match");
    expect(ranked).toHaveLength(1);
    expect(ranked[0]?.id).toBe("1");
  });

  it("returns empty array for empty query", () => {
    expect(rankSearchResults([makeTrack()], "")).toEqual([]);
  });
});
