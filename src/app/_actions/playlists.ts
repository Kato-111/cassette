"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export const createPlaylistAction = async (
  name = "New Playlist",
): Promise<ActionResult<{ id: string }>> => {
  try {
    const created = await prisma.playlist.create({
      data: { name },
      select: { id: true },
    });
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath("/", "layout");
    return { ok: true, id: created.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const renamePlaylistAction = async (
  id: string,
  name: string,
): Promise<ActionResult> => {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name cannot be empty" };

  try {
    await prisma.playlist.update({
      where: { id },
      data: { name: trimmed },
    });
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/p/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const removePlaylistAction = async (
  id: string,
): Promise<ActionResult> => {
  try {
    await prisma.$transaction([
      prisma.playlistTrack.deleteMany({ where: { playlistId: id } }),
      prisma.playlist.delete({ where: { id } }),
    ]);
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const attachTrackAction = async (
  playlistId: string,
  trackId: string,
): Promise<ActionResult> => {
  try {
    const exists = await prisma.playlistTrack.findUnique({
      where: { playlistId_trackId: { playlistId, trackId } },
    });
    if (exists) {
      return { ok: false, error: "Track is already in this playlist" };
    }

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

    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/p/${playlistId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const reorderPlaylistTracksAction = async (
  playlistId: string,
  trackIds: string[],
): Promise<ActionResult> => {
  if (trackIds.length === 0) return { ok: true };

  try {
    await prisma.$transaction(
      trackIds.map((trackId, order) =>
        prisma.playlistTrack.update({
          where: { playlistId_trackId: { playlistId, trackId } },
          data: { order },
        }),
      ),
    );
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/p/${playlistId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const detachTrackAction = async (
  playlistId: string,
  trackId: string,
): Promise<ActionResult> => {
  try {
    await prisma.playlistTrack.delete({
      where: { playlistId_trackId: { playlistId, trackId } },
    });
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/p/${playlistId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
