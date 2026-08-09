import { parseBuffer, type IAudioMetadata } from "music-metadata";

export interface ExtractedMetadata {
  title: string;
  artist: string;
  album: string | null;
  durationSec: number;
  genre: string | null;
  key: string | null;
  picture: {
    data: Buffer;
    mime: string;
    ext: string;
  } | null;
}

export const extractMetadata = async (
  buffer: Buffer,
  fallbackTitle: string,
  mimeType = "audio/mpeg",
): Promise<ExtractedMetadata> => {
  const meta: IAudioMetadata = await parseBuffer(buffer, { mimeType });
  const c = meta.common;

  const cover = c.picture?.[0];
  const picture = cover
    ? {
        data: Buffer.from(cover.data),
        mime: cover.format,
        ext: cover.format.split("/")[1] ?? "jpg",
      }
    : null;

  return {
    title: c.title?.trim() || fallbackTitle,
    artist: c.artist?.trim() || "Unknown Artist",
    album: c.album?.trim() || null,
    durationSec: Math.round(meta.format.duration ?? 0),
    genre: c.genre?.[0]?.trim() || null,
    key: (c as { key?: string }).key ?? null,
    picture,
  };
};
