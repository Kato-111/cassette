import { describe, expect, it } from "vitest";
import {
  buildAlbumSummaries,
  decodeAlbumId,
  encodeAlbumId,
} from "@/lib/albums";

describe("albums", () => {
  it("encodes and decodes album ids", () => {
    const id = encodeAlbumId("Discovery");
    expect(decodeAlbumId(id)).toEqual({ album: "Discovery" });
  });

  it("returns null for invalid album ids", () => {
    expect(decodeAlbumId("not-valid!!!")).toBeNull();
    expect(decodeAlbumId(encodeAlbumId(""))).toBeNull();
  });

  it("only includes albums with more than one track", () => {
    const summaries = buildAlbumSummaries([
      {
        artist: "Artist A",
        album: "Solo",
        artworkUrl: null,
        durationSec: 180,
      },
      {
        artist: "Artist B",
        album: "Full LP",
        artworkUrl: "cover.jpg",
        durationSec: 200,
      },
      {
        artist: "Artist B",
        album: "Full LP",
        artworkUrl: null,
        durationSec: 210,
      },
    ]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      name: "Full LP",
      artist: "Artist B",
      coverUrl: "cover.jpg",
      trackCount: 2,
      durationSec: 410,
    });
  });

  it("groups tracks with the same album name into one album", () => {
    const summaries = buildAlbumSummaries([
      {
        artist: "Artist A",
        album: "Hits",
        artworkUrl: null,
        durationSec: 100,
      },
      {
        artist: "Artist A",
        album: "Hits",
        artworkUrl: null,
        durationSec: 120,
      },
      {
        artist: "Artist B",
        album: "Hits",
        artworkUrl: null,
        durationSec: 130,
      },
      {
        artist: "Artist B",
        album: "Hits",
        artworkUrl: null,
        durationSec: 140,
      },
    ]);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({
      name: "Hits",
      artist: "Various Artists",
      trackCount: 4,
      durationSec: 490,
    });
  });

  it("respects a custom minTracks threshold", () => {
    const tracks = [
      { artist: "A", album: "Solo", artworkUrl: null, durationSec: 100 },
      { artist: "A", album: "Duo", artworkUrl: null, durationSec: 100 },
      { artist: "A", album: "Duo", artworkUrl: null, durationSec: 100 },
      { artist: "A", album: "Trio", artworkUrl: null, durationSec: 100 },
      { artist: "A", album: "Trio", artworkUrl: null, durationSec: 100 },
      { artist: "A", album: "Trio", artworkUrl: null, durationSec: 100 },
    ];

    expect(buildAlbumSummaries(tracks, { minTracks: 1 })).toHaveLength(3);
    expect(buildAlbumSummaries(tracks, { minTracks: 3 })).toHaveLength(1);
    expect(
      buildAlbumSummaries(tracks, { minTracks: 3 })[0],
    ).toMatchObject({ name: "Trio", trackCount: 3 });
  });

  it("excludes albums listed in hiddenNames", () => {
    const summaries = buildAlbumSummaries(
      [
        { artist: "A", album: "Visible", artworkUrl: null, durationSec: 100 },
        { artist: "A", album: "Visible", artworkUrl: null, durationSec: 100 },
        { artist: "A", album: "Hidden", artworkUrl: null, durationSec: 100 },
        { artist: "A", album: "Hidden", artworkUrl: null, durationSec: 100 },
      ],
      { hiddenNames: new Set(["Hidden"]) },
    );

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ name: "Visible" });
  });
});
