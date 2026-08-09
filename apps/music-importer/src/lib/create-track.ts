import { prisma } from "./db.ts";
import { putObject } from "./r2.ts";
import { extractMetadata, type ExtractedMetadata } from "./metadata.ts";

export interface CreateTrackInput {
  buffer: Buffer;
  mime: string;
  ext: string;
  fallbackTitle: string;
  overrides?: Partial<
    Pick<ExtractedMetadata, "title" | "artist" | "album" | "durationSec">
  >;
  youtubeVideoId?: string;
  spotifyTrackId?: string;
  sourceUrl?: string;
  artworkBuffer?: Buffer;
  artworkMime?: string;
  artworkExt?: string;
}

export interface CreatedTrack {
  id: string;
  title: string;
  storageKey: string;
}

export const createTrackFromBuffer = async (
  input: CreateTrackInput,
): Promise<CreatedTrack> => {
  const meta = await extractMetadata(
    input.buffer,
    input.fallbackTitle,
    input.mime,
  );

  const title = input.overrides?.title ?? meta.title;
  const artist = input.overrides?.artist ?? meta.artist;
  const album = input.overrides?.album ?? meta.album;
  const durationSec = input.overrides?.durationSec ?? meta.durationSec;

  const storageKey = `audio/${crypto.randomUUID()}${input.ext}`;

  await putObject(storageKey, input.buffer, input.mime);

  const lastInLibrary = await prisma.track.findFirst({
    orderBy: { libraryOrder: "desc" },
    select: { libraryOrder: true },
  });

  const track = await prisma.track.create({
    data: {
      title,
      artist,
      album,
      durationSec,
      genre: meta.genre,
      key: meta.key,
      storageKey,
      libraryOrder: (lastInLibrary?.libraryOrder ?? -1) + 1,
      isLocal: false,
      youtubeVideoId: input.youtubeVideoId,
      spotifyTrackId: input.spotifyTrackId,
      sourceUrl: input.sourceUrl,
    },
    select: { id: true, title: true, storageKey: true },
  });

  const picture = input.artworkBuffer
    ? {
        data: input.artworkBuffer,
        mime: input.artworkMime ?? "image/jpeg",
        ext: input.artworkExt ?? "jpg",
      }
    : meta.picture;

  if (picture) {
    const artworkKey = `artwork/${track.id}.${picture.ext}`;
    const artworkUrl = await putObject(
      artworkKey,
      picture.data,
      picture.mime,
    );
    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });
  }

  return track;
};

export const attachTrackToPlaylist = async (
  playlistId: string,
  trackId: string,
): Promise<void> => {
  const exists = await prisma.playlistTrack.findUnique({
    where: { playlistId_trackId: { playlistId, trackId } },
  });
  if (exists) return;

  const last = await prisma.playlistTrack.findFirst({
    where: { playlistId },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  await prisma.playlistTrack.create({
    data: {
      playlistId,
      trackId,
      order: (last?.order ?? 0) + 1,
    },
  });
};
