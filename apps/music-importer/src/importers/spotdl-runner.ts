import { execFile } from "node:child_process";
import { readFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { config } from "../lib/config.ts";
import type { DownloadedAudio, ImportItem } from "./types.ts";

const execFileAsync = promisify(execFile);

export interface SpotdlSong {
  name: string;
  artist: string;
  artists: string[];
  album_name: string;
  duration: number;
  song_id: string;
  url: string;
  cover_url: string | null;
}

const spotdlBaseArgs = (): string[] => {
  const args = ["--log-level", "ERROR", "--format", "mp3", "--print-errors"];
  if (config.spotify.clientId) {
    args.push("--client-id", config.spotify.clientId);
  }
  if (config.spotify.clientSecret) {
    args.push("--client-secret", config.spotify.clientSecret);
  }
  return args;
};

const runSpotdl = async (args: string[]): Promise<void> => {
  await execFileAsync("spotdl", [...spotdlBaseArgs(), ...args], {
    maxBuffer: 50 * 1024 * 1024,
  });
};

export const spotdlSongToImportItem = (song: SpotdlSong): ImportItem => {
  const artist =
    song.artist?.trim() ||
    song.artists?.map((name) => name.trim()).filter(Boolean).join(", ") ||
    "Unknown Artist";

  return {
    sourceItemId: song.song_id,
    title: song.name?.trim() || "Untitled",
    artist,
    album: song.album_name?.trim() || undefined,
    durationSec: Math.max(0, Math.round(song.duration ?? 0)),
    sourceUrl: song.url,
    thumbnailUrl: song.cover_url ?? undefined,
  };
};

export const parseSpotdlSaveFile = (raw: string): ImportItem[] => {
  const songs = JSON.parse(raw) as SpotdlSong[];
  if (!Array.isArray(songs)) {
    throw new Error("spotdl save file did not contain a song list");
  }

  return songs
    .filter((song) => !!song?.song_id)
    .map((song) => spotdlSongToImportItem(song));
};

export const saveSpotifyUrl = async (url: string): Promise<ImportItem[]> => {
  const saveFile = join(tmpdir(), `spotdl-${crypto.randomUUID()}.spotdl`);

  try {
    await runSpotdl(["save", url, "--save-file", saveFile]);
    const raw = await readFile(saveFile, "utf8");
    return parseSpotdlSaveFile(raw);
  } finally {
    await unlink(saveFile).catch(() => {});
  }
};

export const downloadSpotifyTrack = async (
  item: ImportItem,
  destDir: string,
): Promise<DownloadedAudio> => {
  const outTemplate = join(destDir, `${item.sourceItemId}.{output-ext}`);

  await runSpotdl(["download", item.sourceUrl, "--output", outTemplate]);

  return {
    filePath: join(destDir, `${item.sourceItemId}.mp3`),
    mime: "audio/mpeg",
    ext: ".mp3",
  };
};
