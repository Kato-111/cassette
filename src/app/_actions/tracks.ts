"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult = { ok: true } | { ok: false; error: string };

const EDITABLE_TEXT_FIELDS = new Set([
  "title",
  "artist",
  "album",
  "genre",
  "key",
]);

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

  let data: Record<string, string | number | null>;

  if (field === "bpm") {
    const trimmed = raw.trim();
    if (trimmed === "") {
      data = { bpm: null };
    } else {
      const n = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(n)) {
        return { ok: false, error: "BPM must be a number" };
      }
      data = { bpm: n };
    }
  } else if (EDITABLE_TEXT_FIELDS.has(field)) {
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
