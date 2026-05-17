"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export const createCollectionAction = async (
  name = "New Collection",
): Promise<ActionResult<{ id: string }>> => {
  try {
    const created = await prisma.collection.create({
      data: { name },
      select: { id: true },
    });
    revalidateTag(CACHE_TAGS.collections, "max");
    revalidatePath("/", "layout");
    return { ok: true, id: created.id };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const renameCollectionAction = async (
  id: string,
  name: string,
): Promise<ActionResult> => {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Name cannot be empty" };

  try {
    await prisma.collection.update({
      where: { id },
      data: { name: trimmed },
    });
    revalidateTag(CACHE_TAGS.collections, "max");
    revalidatePath(`/c/${id}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const removeCollectionAction = async (
  id: string,
): Promise<ActionResult> => {
  try {
    await prisma.$transaction([
      prisma.collectionTrack.deleteMany({ where: { collectionId: id } }),
      prisma.collection.delete({ where: { id } }),
    ]);
    revalidateTag(CACHE_TAGS.collections, "max");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const attachTrackAction = async (
  collectionId: string,
  trackId: string,
): Promise<ActionResult> => {
  try {
    const exists = await prisma.collectionTrack.findUnique({
      where: { collectionId_trackId: { collectionId, trackId } },
    });
    if (exists) {
      return { ok: false, error: "Track is already in this collection" };
    }

    const last = await prisma.collectionTrack.findFirst({
      where: { collectionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    await prisma.collectionTrack.create({
      data: {
        collectionId,
        trackId,
        order: (last?.order ?? 0) + 1,
      },
    });

    revalidateTag(CACHE_TAGS.collections, "max");
    revalidatePath(`/c/${collectionId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const detachTrackAction = async (
  collectionId: string,
  trackId: string,
): Promise<ActionResult> => {
  try {
    await prisma.collectionTrack.delete({
      where: { collectionId_trackId: { collectionId, trackId } },
    });
    revalidateTag(CACHE_TAGS.collections, "max");
    revalidatePath(`/c/${collectionId}`);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
