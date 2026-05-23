"use server";

import { revalidatePath } from "next/cache";
import {
  MIN_ALBUM_TRACKS_BOUNDS,
  setAlbumHidden,
  setMinAlbumTracks,
} from "@/lib/settings";

type ActionResult = { ok: true } | { ok: false; error: string };

export const setMinAlbumTracksAction = async (
  value: number,
): Promise<ActionResult> => {
  const n = Number.isFinite(value) ? Math.trunc(value) : NaN;
  if (
    !Number.isFinite(n) ||
    n < MIN_ALBUM_TRACKS_BOUNDS.min ||
    n > MIN_ALBUM_TRACKS_BOUNDS.max
  ) {
    return {
      ok: false,
      error: `Must be between ${MIN_ALBUM_TRACKS_BOUNDS.min} and ${MIN_ALBUM_TRACKS_BOUNDS.max}`,
    };
  }

  try {
    await setMinAlbumTracks(n);
    revalidatePath("/", "layout");
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const toggleAlbumVisibilityAction = async (
  albumName: string,
  hidden: boolean,
): Promise<ActionResult> => {
  if (!albumName.trim()) return { ok: false, error: "Missing album" };

  try {
    await setAlbumHidden(albumName, hidden);
    revalidatePath("/", "layout");
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
