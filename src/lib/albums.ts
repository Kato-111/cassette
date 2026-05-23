import type { Track } from "@prisma/client";

export type AlbumSummary = {
  id: string;
  name: string;
  artist: string;
  coverUrl: string | null;
  trackCount: number;
  durationSec: number;
};

type AlbumTrackFields = Pick<
  Track,
  "album" | "artist" | "artworkUrl" | "durationSec"
>;

const deriveAlbumArtist = (artists: Set<string>) => {
  if (artists.size === 0) return "Unknown Artist";
  if (artists.size === 1) return [...artists][0]!;
  return "Various Artists";
};

export const encodeAlbumId = (album: string) =>
  Buffer.from(album, "utf8").toString("base64url");

export const decodeAlbumId = (id: string): { album: string } | null => {
  try {
    const album = Buffer.from(id, "base64url").toString("utf8");
    if (!album || encodeAlbumId(album) !== id) return null;
    return { album };
  } catch {
    return null;
  }
};

export type BuildAlbumSummariesOptions = {
  minTracks?: number;
  hiddenNames?: ReadonlySet<string>;
};

export const buildAlbumSummaries = (
  tracks: AlbumTrackFields[],
  { minTracks = 2, hiddenNames }: BuildAlbumSummariesOptions = {},
): AlbumSummary[] => {
  const grouped = new Map<
    string,
    {
      name: string;
      artists: Set<string>;
      coverUrl: string | null;
      trackCount: number;
      durationSec: number;
    }
  >();

  for (const track of tracks) {
    if (!track.album) continue;

    const existing = grouped.get(track.album);

    if (existing) {
      existing.trackCount += 1;
      existing.durationSec += track.durationSec;
      existing.artists.add(track.artist);
      if (!existing.coverUrl && track.artworkUrl) {
        existing.coverUrl = track.artworkUrl;
      }
      continue;
    }

    grouped.set(track.album, {
      name: track.album,
      artists: new Set([track.artist]),
      coverUrl: track.artworkUrl,
      trackCount: 1,
      durationSec: track.durationSec,
    });
  }

  return [...grouped.values()]
    .filter((album) => album.trackCount >= minTracks)
    .filter((album) => !hiddenNames?.has(album.name))
    .map((album) => ({
      id: encodeAlbumId(album.name),
      name: album.name,
      artist: deriveAlbumArtist(album.artists),
      coverUrl: album.coverUrl,
      trackCount: album.trackCount,
      durationSec: album.durationSec,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};
