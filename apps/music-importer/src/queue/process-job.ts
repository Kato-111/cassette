import { mkdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Prisma } from "../../generated/client";
import { prisma } from "../lib/db.ts";
import { config } from "../lib/config.ts";
import {
  attachTrackToPlaylist,
  createTrackFromBuffer,
} from "../lib/create-track.ts";
import { resolveProvider } from "../importers/registry.ts";
import { fetchYoutubeThumbnail, enrichImportItem } from "../importers/youtube.ts";
import type { ImportJobError, ImportItem } from "../importers/types.ts";

const parseErrors = (value: unknown): ImportJobError[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (entry): entry is ImportJobError =>
      typeof entry === "object" &&
      entry !== null &&
      typeof (entry as ImportJobError).sourceItemId === "string" &&
      typeof (entry as ImportJobError).title === "string" &&
      typeof (entry as ImportJobError).message === "string",
  );
};

const jobTempDir = (jobId: string): string =>
  join(config.tempDir, jobId);

const cleanupTempDir = async (dir: string): Promise<void> => {
  try {
    const { readdir } = await import("node:fs/promises");
    const files = await readdir(dir);
    await Promise.all(files.map((file) => unlink(join(dir, file))));
  } catch {
    // best effort
  }
};

const updateJob = async (
  jobId: string,
  data: {
    status?: string;
    total?: number;
    completed?: number;
    failed?: number;
    trackIds?: string[];
    errors?: ImportJobError[];
  },
): Promise<void> => {
  const { errors, ...rest } = data;
  await prisma.importJob.update({
    where: { id: jobId },
    data: {
      ...rest,
      ...(errors
        ? { errors: errors as unknown as Prisma.InputJsonValue }
        : {}),
    },
  });
};

const findExistingTrackId = async (
  item: ImportItem,
  source: string,
): Promise<string | null> => {
  if (source === "youtube") {
    const existing = await prisma.track.findFirst({
      where: { youtubeVideoId: item.sourceItemId },
      select: { id: true },
    });
    return existing?.id ?? null;
  }

  if (source === "spotify") {
    const existing = await prisma.track.findFirst({
      where: { spotifyTrackId: item.sourceItemId },
      select: { id: true },
    });
    return existing?.id ?? null;
  }

  return null;
};

const patchTrackMetadataIfEmpty = async (
  trackId: string,
  item: ImportItem,
): Promise<void> => {
  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { album: true, artist: true },
  });
  if (!track) return;

  const data: { album?: string; artist?: string } = {};
  if (!track.album?.trim() && item.album?.trim()) {
    data.album = item.album.trim();
  }
  if (
    track.artist === "Unknown Artist" &&
    item.artist.trim() &&
    item.artist !== "Unknown Artist"
  ) {
    data.artist = item.artist.trim();
  }

  if (Object.keys(data).length === 0) return;

  await prisma.track.update({
    where: { id: trackId },
    data,
  });
};

const processItem = async (
  item: ImportItem,
  source: string,
  destDir: string,
  playlistId: string | null,
): Promise<{ trackId: string; skipped: boolean }> => {
  const resolvedItem =
    source === "youtube" ? await enrichImportItem(item) : item;

  const existingId = await findExistingTrackId(resolvedItem, source);
  if (existingId) {
    await patchTrackMetadataIfEmpty(existingId, resolvedItem);
    if (playlistId) {
      await attachTrackToPlaylist(playlistId, existingId);
    }
    return { trackId: existingId, skipped: true };
  }

  const provider = resolveProvider(resolvedItem.sourceUrl);
  const downloaded = await provider.downloadItem(resolvedItem, destDir);
  const buffer = await readFile(downloaded.filePath);

  let artworkBuffer: Buffer | undefined;
  let artworkMime: string | undefined;
  let artworkExt: string | undefined;

  if (source === "youtube") {
    const thumb = await fetchYoutubeThumbnail(resolvedItem.sourceItemId);
    if (thumb) {
      artworkBuffer = thumb.buffer;
      artworkMime = thumb.mime;
      artworkExt = thumb.ext;
    }
  } else if (source === "spotify" && resolvedItem.thumbnailUrl) {
    try {
      const res = await fetch(resolvedItem.thumbnailUrl);
      if (res.ok) {
        artworkBuffer = Buffer.from(await res.arrayBuffer());
        artworkMime = res.headers.get("content-type") ?? "image/jpeg";
        artworkExt = artworkMime.includes("png") ? "png" : "jpg";
      }
    } catch {
      // artwork is optional
    }
  }

  const track = await createTrackFromBuffer({
    buffer,
    mime: downloaded.mime,
    ext: downloaded.ext,
    fallbackTitle: resolvedItem.title,
    overrides: {
      title: resolvedItem.title,
      artist: resolvedItem.artist,
      album: resolvedItem.album,
      durationSec: resolvedItem.durationSec,
    },
    youtubeVideoId: source === "youtube" ? resolvedItem.sourceItemId : undefined,
    spotifyTrackId: source === "spotify" ? resolvedItem.sourceItemId : undefined,
    sourceUrl: resolvedItem.sourceUrl,
    artworkBuffer,
    artworkMime,
    artworkExt,
  });

  if (playlistId) {
    await attachTrackToPlaylist(playlistId, track.id);
  }

  await unlink(downloaded.filePath).catch(() => {});

  return { trackId: track.id, skipped: false };
};

const runWithConcurrency = async <T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> => {
  if (items.length === 0) return;

  let nextIndex = 0;
  const workerCount = Math.min(concurrency, items.length);

  const worker = async (): Promise<void> => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      await fn(items[index]!);
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
};

export const processImportJob = async (jobId: string): Promise<void> => {
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error(`Import job not found: ${jobId}`);

  const destDir = jobTempDir(jobId);
  await mkdir(destDir, { recursive: true });

  const trackIds = [...job.trackIds];
  const errors = parseErrors(job.errors);

  try {
    await updateJob(jobId, { status: "processing" });

    const provider = resolveProvider(job.sourceUrl);
    const allItems = await provider.listItems(job.sourceUrl);
    const items =
      job.limit != null ? allItems.slice(0, job.limit) : allItems;

    await updateJob(jobId, { total: items.length });

    let completed = 0;
    let failed = 0;
    let progressUpdateChain = Promise.resolve();

    const scheduleProgressUpdate = (): void => {
      progressUpdateChain = progressUpdateChain.then(() =>
        updateJob(jobId, {
          completed,
          failed,
          trackIds: [...trackIds],
          errors: [...errors],
        }),
      );
    };

    await runWithConcurrency(
      items,
      config.maxConcurrentItems,
      async (item) => {
        try {
          const result = await processItem(
            item,
            provider.source,
            destDir,
            job.playlistId,
          );
          if (!trackIds.includes(result.trackId)) {
            trackIds.push(result.trackId);
          }
          completed += 1;
        } catch (err) {
          failed += 1;
          errors.push({
            sourceItemId: item.sourceItemId,
            title: item.title,
            message: (err as Error).message,
          });
        }

        scheduleProgressUpdate();
      },
    );

    await progressUpdateChain;

    const finalStatus =
      failed > 0 && completed === 0 ? "failed" : "completed";
    await updateJob(jobId, { status: finalStatus });
  } catch (err) {
    errors.push({
      sourceItemId: "job",
      title: job.sourceUrl,
      message: (err as Error).message,
    });
    await updateJob(jobId, {
      status: "failed",
      errors,
    });
    throw err;
  } finally {
    await cleanupTempDir(destDir);
  }
};
