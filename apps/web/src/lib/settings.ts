import { prisma } from "./db";

export const DEFAULT_MIN_ALBUM_TRACKS = 2;
export const MIN_ALBUM_TRACKS_BOUNDS = { min: 1, max: 50 } as const;

const SETTING_KEYS = {
  minAlbumTracks: "minAlbumTracks",
} as const;

export const getMinAlbumTracks = async (): Promise<number> => {
  const row = await prisma.appSetting.findUnique({
    where: { key: SETTING_KEYS.minAlbumTracks },
  });
  if (!row) return DEFAULT_MIN_ALBUM_TRACKS;
  const parsed = Number.parseInt(row.value, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_ALBUM_TRACKS;
  return Math.min(
    MIN_ALBUM_TRACKS_BOUNDS.max,
    Math.max(MIN_ALBUM_TRACKS_BOUNDS.min, parsed),
  );
};

export const setMinAlbumTracks = async (value: number): Promise<void> => {
  await prisma.appSetting.upsert({
    where: { key: SETTING_KEYS.minAlbumTracks },
    update: { value: String(value) },
    create: { key: SETTING_KEYS.minAlbumTracks, value: String(value) },
  });
};

export const getHiddenAlbumNames = async (): Promise<Set<string>> => {
  const rows = await prisma.hiddenAlbum.findMany({
    select: { albumName: true },
  });
  return new Set(rows.map((r) => r.albumName));
};

export const setAlbumHidden = async (
  albumName: string,
  hidden: boolean,
): Promise<void> => {
  if (hidden) {
    await prisma.hiddenAlbum.upsert({
      where: { albumName },
      update: {},
      create: { albumName },
    });
  } else {
    await prisma.hiddenAlbum.deleteMany({ where: { albumName } });
  }
};

export const getAlbumSettings = async () => {
  const [minAlbumTracks, hiddenAlbumNames] = await Promise.all([
    getMinAlbumTracks(),
    getHiddenAlbumNames(),
  ]);
  return { minAlbumTracks, hiddenAlbumNames };
};
