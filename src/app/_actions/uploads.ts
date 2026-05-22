"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { extname, parse } from "node:path";
import { prisma } from "@/lib/db";
import { putObject } from "@/lib/r2";
import { extractMetadata } from "@/lib/metadata";
import { AUDIO_MIME_BY_EXT } from "@/lib/audio-mime";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

const extFromMime = (mime: string, fallback = "jpg"): string => {
  const m = mime.toLowerCase();
  if (m === "image/jpeg" || m === "image/jpg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  if (m === "image/avif") return "avif";
  return fallback;
};

const fileToBuffer = async (file: File): Promise<Buffer> =>
  Buffer.from(await file.arrayBuffer());

export const uploadPlaylistCoverAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ coverUrl: string }>> => {
  const playlistId = formData.get("playlistId");
  const file = formData.get("file");

  if (typeof playlistId !== "string") {
    return { ok: false, error: "Missing playlistId" };
  }
  if (!(file instanceof File)) {
    return { ok: false, error: "Missing file" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "File exceeds 5MB limit" };
  }

  try {
    const buf = await fileToBuffer(file);
    const ext = extFromMime(file.type);
    const key = `covers/${playlistId}.${ext}`;
    const coverUrl = await putObject(key, buf, file.type || "image/jpeg");

    await prisma.playlist.update({
      where: { id: playlistId },
      data: { coverUrl },
    });

    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/playlist/${playlistId}`);
    return { ok: true, coverUrl };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const uploadTrackAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ trackId: string; title: string }>> => {
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { ok: false, error: "Missing file" };
  }
  if (file.size === 0) {
    return { ok: false, error: "File is empty" };
  }
  if (file.size > MAX_AUDIO_BYTES) {
    return { ok: false, error: "File exceeds 50MB limit" };
  }

  const ext = extname(file.name).toLowerCase();
  const mime = AUDIO_MIME_BY_EXT[ext] ?? file.type;
  if (!mime || !mime.startsWith("audio/")) {
    return { ok: false, error: "Unsupported file type" };
  }

  try {
    const buf = await fileToBuffer(file);
    const meta = await extractMetadata(buf, parse(file.name).name, mime);

    const storageKey = `audio/${crypto.randomUUID()}${ext || ""}`;
    const existing = await prisma.track.findUnique({ where: { storageKey } });
    if (existing) {
      return { ok: false, error: "Track already exists" };
    }

    await putObject(storageKey, buf, mime);

    const lastInLibrary = await prisma.track.findFirst({
      orderBy: { libraryOrder: "desc" },
      select: { libraryOrder: true },
    });

    const track = await prisma.track.create({
      data: {
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        durationSec: meta.durationSec,
        genre: meta.genre,
        bpm: meta.bpm,
        key: meta.key,
        storageKey,
        libraryOrder: (lastInLibrary?.libraryOrder ?? -1) + 1,
        isLocal: false,
      },
      select: { id: true, title: true },
    });

    if (meta.picture) {
      const artworkKey = `artwork/${track.id}.${meta.picture.ext}`;
      const artworkUrl = await putObject(
        artworkKey,
        meta.picture.data,
        meta.picture.mime,
      );
      await prisma.track.update({
        where: { id: track.id },
        data: { artworkUrl },
      });
    }

    revalidateTag(CACHE_TAGS.tracks, "max");
    revalidatePath("/", "layout");
    return { ok: true, trackId: track.id, title: track.title };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const uploadTrackArtworkAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ artworkUrl: string }>> => {
  const trackId = formData.get("trackId");
  const file = formData.get("file");

  if (typeof trackId !== "string") {
    return { ok: false, error: "Missing trackId" };
  }
  if (!(file instanceof File)) {
    return { ok: false, error: "Missing file" };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "File exceeds 5MB limit" };
  }

  try {
    const buf = await fileToBuffer(file);
    const ext = extFromMime(file.type);
    const key = `artwork/${trackId}.${ext}`;
    const artworkUrl = await putObject(key, buf, file.type || "image/jpeg");

    await prisma.track.update({
      where: { id: trackId },
      data: { artworkUrl },
    });

    revalidateTag(CACHE_TAGS.tracks, "max");
    revalidatePath("/", "layout");
    return { ok: true, artworkUrl };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
