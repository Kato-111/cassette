"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { putObject } from "@/lib/r2";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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

export const uploadCollectionCoverAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ coverUrl: string }>> => {
  const collectionId = formData.get("collectionId");
  const file = formData.get("file");

  if (typeof collectionId !== "string") {
    return { ok: false, error: "Missing collectionId" };
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
    const key = `covers/${collectionId}.${ext}`;
    const coverUrl = await putObject(key, buf, file.type || "image/jpeg");

    await prisma.collection.update({
      where: { id: collectionId },
      data: { coverUrl },
    });

    revalidateTag(CACHE_TAGS.collections, "max");
    revalidatePath(`/c/${collectionId}`);
    return { ok: true, coverUrl };
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
