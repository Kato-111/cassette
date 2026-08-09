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
    revalidatePath(`/playlist/${id}`);
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
    revalidatePath(`/playlist/${playlistId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const attachTracksAction = async (
  playlistId: string,
  trackIds: string[],
): Promise<ActionResult<{ added: number }>> => {
  if (trackIds.length === 0) return { ok: true, added: 0 };

  try {
    const added = await prisma.$transaction(async (tx) => {
      const existing = await tx.playlistTrack.findMany({
        where: { playlistId, trackId: { in: trackIds } },
        select: { trackId: true },
      });
      const taken = new Set(existing.map((e) => e.trackId));
      const fresh = trackIds.filter((id) => !taken.has(id));
      if (fresh.length === 0) return 0;

      const last = await tx.playlistTrack.findFirst({
        where: { playlistId },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      const base = (last?.order ?? 0) + 1;

      await tx.playlistTrack.createMany({
        data: fresh.map((trackId, i) => ({
          playlistId,
          trackId,
          order: base + i,
        })),
      });

      return fresh.length;
    });

    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/playlist/${playlistId}`);
    return { ok: true, added };
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
    revalidatePath(`/playlist/${playlistId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const detachTrackAction = async (
  playlistId: string,
  trackId: string,
): Promise<ActionResult> => detachTracksAction(playlistId, [trackId]);

export const detachTracksAction = async (
  playlistId: string,
  trackIds: string[],
): Promise<ActionResult> => {
  if (trackIds.length === 0) return { ok: true };

  try {
    await prisma.playlistTrack.deleteMany({
      where: { playlistId, trackId: { in: trackIds } },
    });
    revalidateTag(CACHE_TAGS.playlists, "max");
    revalidatePath(`/playlist/${playlistId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
