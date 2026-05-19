import type { Track } from "@prisma/client";
import { prisma } from "./db";

export const CACHE_TAGS = {
  tracks: "tracks",
  playlists: "playlists",
} as const;

export const getAllTracks = async () =>
  prisma.track.findMany({
    orderBy: [{ libraryOrder: "asc" }, { title: "asc" }],
  });

export const getTrackById = async (id: string) =>
  prisma.track.findUnique({ where: { id } });

export const getAllPlaylists = async () =>
  prisma.playlist.findMany({ orderBy: { createdAt: "desc" } });

export const getPlaylistWithTracks = async (id: string) => {
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { order: "asc" },
        include: { track: true },
      },
    },
  });

  if (!playlist) return null;

  const tracks = playlist.tracks.map((pt) => ({
    ...pt.track,
    order: pt.order,
  }));

  return {
    id: playlist.id,
    name: playlist.name,
    coverUrl: playlist.coverUrl,
    createdAt: playlist.createdAt,
    updatedAt: playlist.updatedAt,
    tracks,
    trackCount: tracks.length,
    durationSec: tracks.reduce((sum, t) => sum + t.durationSec, 0),
  };
};

export type PlaylistWithTracks = NonNullable<
  Awaited<ReturnType<typeof getPlaylistWithTracks>>
>;

export const searchTracks = async (rawQuery: string) => {
  const q = rawQuery.trim();
  if (!q) return [];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = { contains: escaped, mode: "insensitive" as const };

  const hits = await prisma.track.findMany({
    where: {
      OR: [{ title: regex }, { artist: regex }, { album: regex }],
    },
    take: 100,
  });

  const needle = q.toLowerCase();
  const score = (s: string | null | undefined) => {
    if (!s) return -1;
    const i = s.toLowerCase().indexOf(needle);
    if (i < 0) return -1;
    return 1000 - i - Math.abs(s.length - needle.length);
  };

  return hits
    .map((t) => ({
      track: t,
      rank: Math.max(score(t.title), score(t.artist), score(t.album)),
    }))
    .sort(
      (a, b) => b.rank - a.rank || a.track.title.localeCompare(b.track.title),
    )
    .slice(0, 50)
    .map((r) => r.track);
};

/** Filter an in-memory track list by the same title/artist/album substring rules as global search. */
export const filterTracksByQuery = (tracks: Track[], rawQuery: string) => {
  const q = rawQuery.trim();
  if (!q) return tracks;
  const needle = q.toLowerCase();
  return tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(needle) ||
      (t.artist?.toLowerCase().includes(needle) ?? false) ||
      (t.album?.toLowerCase().includes(needle) ?? false),
  );
};
