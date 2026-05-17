import { prisma } from "./db";

export const CACHE_TAGS = {
  tracks: "tracks",
  collections: "collections",
} as const;

export const getAllTracks = async () =>
  prisma.track.findMany({ orderBy: { title: "asc" } });

export const getTrackById = async (id: string) =>
  prisma.track.findUnique({ where: { id } });

export const getAllCollections = async () =>
  prisma.collection.findMany({ orderBy: { createdAt: "desc" } });

export const getCollectionWithTracks = async (id: string) => {
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      tracks: {
        orderBy: { order: "asc" },
        include: { track: true },
      },
    },
  });

  if (!collection) return null;

  const tracks = collection.tracks.map((ct) => ({
    ...ct.track,
    order: ct.order,
  }));

  return {
    id: collection.id,
    name: collection.name,
    coverUrl: collection.coverUrl,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
    tracks,
    trackCount: tracks.length,
    durationSec: tracks.reduce((sum, t) => sum + t.durationSec, 0),
  };
};

export type CollectionWithTracks = NonNullable<
  Awaited<ReturnType<typeof getCollectionWithTracks>>
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
