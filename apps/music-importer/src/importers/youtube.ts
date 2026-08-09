import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { Innertube } from "youtubei.js";
import type { DownloadedAudio, ImportItem, ImportProvider } from "./types.ts";

const execFileAsync = promisify(execFile);

interface YtdlpEntry {
  id?: string;
  title?: string;
  artist?: string;
  album?: string;
  series?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  url?: string;
  webpage_url?: string;
  thumbnails?: { url?: string }[];
}

interface YtdlpPlaylistJson {
  title?: string;
  entries?: YtdlpEntry[];
  id?: string;
  webpage_url?: string;
  uploader?: string;
  channel?: string;
  duration?: number;
  thumbnails?: { url?: string }[];
}

type YouTubeMusicSong = {
  id?: string;
  item_type?: string;
  title?: string;
  artists?: { name: string }[];
  album?: { name: string };
  duration?: { seconds: number };
  thumbnails?: { url: string }[];
};

let innertubePromise: Promise<Innertube> | undefined;

const getInnertube = (): Promise<Innertube> => {
  if (innertubePromise) return innertubePromise;

  innertubePromise = Innertube.create().catch((err) => {
    // Do not permanently cache an initialization failure (e.g. a transient
    // upstream network error); the next request should be able to retry.
    innertubePromise = undefined;
    throw err;
  });
  return innertubePromise;
};

const runYtdlp = async (args: string[]): Promise<string> => {
  const { stdout } = await execFileAsync("yt-dlp", args, {
    maxBuffer: 50 * 1024 * 1024,
  });
  return stdout;
};

/** Strip YouTube clutter like "(Official Video)" and "(Lyrics)" from titles. */
export const cleanImportTitle = (title: string): string => {
  const trimmed = title.trim();
  if (!trimmed) return "Untitled";

  const cleaned = trimmed
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return cleaned || trimmed;
};

const importTitle = (title?: string): string =>
  cleanImportTitle(title?.trim() || "Untitled");

export const resolveYtdlpAlbum = (
  entry: YtdlpEntry,
  playlistAlbum?: string,
): string | undefined => {
  const album = entry.album?.trim() || entry.series?.trim();
  if (album) return album;
  const fallback = playlistAlbum?.trim();
  return fallback || undefined;
};

const entryArtist = (entry: YtdlpEntry): string =>
  (entry.artist ?? entry.uploader ?? entry.channel ?? "Unknown Artist").trim();

const entryToItem = (entry: YtdlpEntry, playlistAlbum?: string): ImportItem => {
  const id = entry.id;
  if (!id) throw new Error("yt-dlp entry missing id");

  const sourceUrl =
    entry.webpage_url ?? entry.url ?? `https://www.youtube.com/watch?v=${id}`;

  return {
    sourceItemId: id,
    title: importTitle(entry.title),
    artist: entryArtist(entry),
    album: resolveYtdlpAlbum(entry, playlistAlbum),
    durationSec: Math.round(entry.duration ?? 0),
    sourceUrl,
    thumbnailUrl: entry.thumbnails?.at(-1)?.url,
  };
};

/** Convert song-only YouTube Music results into importable YouTube items. */
export const youtubeMusicSongsToItems = (
  songs: readonly YouTubeMusicSong[],
  limit: number,
): ImportItem[] =>
  songs
    .filter(
      (song): song is YouTubeMusicSong & { id: string; title: string } =>
        song.item_type === "song" && Boolean(song.id && song.title),
    )
    .slice(0, limit)
    .map((song) => ({
      sourceItemId: song.id,
      title: importTitle(song.title),
      artist:
        song.artists
          ?.map((artist) => artist.name.trim())
          .filter(Boolean)
          .join(", ") || "Unknown Artist",
      album: song.album?.name.trim() || undefined,
      durationSec: song.duration?.seconds ?? 0,
      sourceUrl: `https://www.youtube.com/watch?v=${song.id}`,
      thumbnailUrl: song.thumbnails?.at(-1)?.url,
    }));

/**
 * Search YouTube Music's song catalog through YouTube.js/InnerTube. yt-dlp
 * remains responsible for downloading the selected result in downloadItem.
 */
export const searchYoutubeMusic = async (
  query: string,
  limit: number,
): Promise<ImportItem[]> => {
  const innertube = await getInnertube();
  const search = await innertube.music.search(query, { type: "song" });
  return youtubeMusicSongsToItems(search.songs?.contents ?? [], limit);
};

const rootToItem = (data: YtdlpEntry): ImportItem => {
  const id = data.id;
  if (!id) throw new Error("yt-dlp response missing id");

  return {
    sourceItemId: id,
    title: importTitle(data.title),
    artist: entryArtist(data),
    album: resolveYtdlpAlbum(data),
    durationSec: Math.round(data.duration ?? 0),
    sourceUrl: data.webpage_url ?? `https://www.youtube.com/watch?v=${id}`,
    thumbnailUrl: data.thumbnails?.at(-1)?.url,
  };
};

export const mergeImportItemMetadata = (
  item: ImportItem,
  data: YtdlpEntry,
): ImportItem => ({
  ...item,
  title: importTitle(data.title?.trim() || item.title),
  artist: entryArtist(data) || item.artist,
  album: resolveYtdlpAlbum(data, item.album) ?? item.album,
  durationSec:
    data.duration != null ? Math.round(data.duration) : item.durationSec,
});

export const enrichImportItem = async (item: ImportItem): Promise<ImportItem> => {
  try {
    const stdout = await runYtdlp(["-J", "--no-playlist", item.sourceUrl]);
    const data = JSON.parse(stdout) as YtdlpEntry;
    return mergeImportItemMetadata(item, data);
  } catch {
    return item;
  }
};

export const youtubeProvider: ImportProvider = {
  source: "youtube",

  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "");
      return (
        host === "youtube.com" ||
        host === "m.youtube.com" ||
        host === "music.youtube.com" ||
        host === "youtu.be"
      );
    } catch {
      return false;
    }
  },

  async listItems(url: string): Promise<ImportItem[]> {
    const flatStdout = await runYtdlp(["--flat-playlist", "-J", url]);
    const flatData = JSON.parse(flatStdout) as YtdlpPlaylistJson;

    if (flatData.entries?.length) {
      const playlistAlbum = flatData.title?.trim() || undefined;
      return flatData.entries
        .filter((entry): entry is YtdlpEntry => !!entry?.id)
        .map((entry) => entryToItem(entry, playlistAlbum));
    }

    return [rootToItem(flatData as YtdlpEntry)];
  },

  async downloadItem(item: ImportItem, destDir: string): Promise<DownloadedAudio> {
    const outTemplate = join(destDir, `${item.sourceItemId}.%(ext)s`);

    await execFileAsync(
      "yt-dlp",
      [
        "-x",
        "--audio-format",
        "mp3",
        "--no-playlist",
        "--embed-metadata",
        "-o",
        outTemplate,
        item.sourceUrl,
      ],
      { maxBuffer: 10 * 1024 * 1024 },
    );

    return {
      filePath: join(destDir, `${item.sourceItemId}.mp3`),
      mime: "audio/mpeg",
      ext: ".mp3",
    };
  },
};

export const fetchYoutubeThumbnail = async (
  videoId: string,
): Promise<{ buffer: Buffer; mime: string; ext: string } | null> => {
  const urls = [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 1000) continue;
      return { buffer, mime: "image/jpeg", ext: "jpg" };
    } catch {
      continue;
    }
  }

  return null;
};
