"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/r2";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

const EDITABLE_TEXT_FIELDS = new Set([
  "title",
  "artist",
  "album",
  "genre",
  "key",
]);

export const toggleFavoriteAction = async (
  trackId: string,
): Promise<ActionResult<{ isFavorite: boolean }>> => {
  if (!trackId.trim()) {
    return { ok: false, error: "Missing trackId" };
  }

  try {
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) return { ok: false, error: "Track not found" };

    const updated = await prisma.track.update({
      where: { id: trackId },
      data: { isFavorite: !track.isFavorite },
      select: { isFavorite: true },
    });

    revalidateTag(CACHE_TAGS.tracks, "max");
    revalidateTag(CACHE_TAGS.favorites, "max");
    revalidatePath("/", "layout");
    revalidatePath("/favorites");
    return { ok: true, isFavorite: updated.isFavorite };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const reorderLibraryTracksAction = async (
  trackIds: string[],
): Promise<ActionResult> => {
  if (trackIds.length === 0) return { ok: true };

  try {
    await prisma.$transaction(
      trackIds.map((id, libraryOrder) =>
        prisma.track.update({
          where: { id },
          data: { libraryOrder },
        }),
      ),
    );
    revalidateTag(CACHE_TAGS.tracks, "max");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const updateTrackFieldAction = async (
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> => {
  const id = formData.get("trackId");
  const field = formData.get("field");

  if (typeof id !== "string" || typeof field !== "string") {
    return { ok: false, error: "Missing trackId or field" };
  }

  const raw = formData.get(field);
  if (typeof raw !== "string") {
    return { ok: false, error: "Missing value" };
  }

  let data: Record<string, string | null>;

  if (EDITABLE_TEXT_FIELDS.has(field)) {
    const trimmed = raw.trim();
    data = { [field]: trimmed === "" ? null : trimmed };
  } else {
    return { ok: false, error: `Field not editable: ${field}` };
  }

  try {
    await prisma.track.update({ where: { id }, data });
    revalidateTag(CACHE_TAGS.tracks, "max");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const deleteTrackAction = async (
  trackId: string,
): Promise<ActionResult> => deleteTracksAction([trackId]);

export const deleteTracksAction = async (
  trackIds: string[],
): Promise<ActionResult> => {
  if (trackIds.length === 0) return { ok: true };

  try {
    const tracks = await prisma.track.findMany({
      where: { id: { in: trackIds } },
      select: { id: true, storageKey: true },
    });

    await prisma.$transaction([
      prisma.playlistTrack.deleteMany({
        where: { trackId: { in: trackIds } },
      }),
      prisma.track.deleteMany({ where: { id: { in: trackIds } } }),
    ]);

    const results = await Promise.allSettled(
      tracks.map((track) => deleteObject(track.storageKey)),
    );
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("R2 delete failed:", result.reason);
      }
    }

    revalidateTag(CACHE_TAGS.tracks, "max");
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidateTag(CACHE_TAGS.favorites, "max");
    revalidatePath("/", "layout");
    revalidatePath("/favorites");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
