import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import { prisma } from "../src/lib/db";
import { extractMetadata } from "../src/lib/metadata";
import { putObject } from "../src/lib/r2";
import { type Choice, radioSelect, textInput } from "./lib/prompt";

const TRACKS_DIR = join(process.cwd(), "tracks");
const ACCEPTED = new Set([".mp3", ".m4a", ".flac", ".ogg", ".wav"]);

const mimeFor = (ext: string): string => {
  switch (ext.toLowerCase()) {
    case ".mp3":
      return "audio/mpeg";
    case ".m4a":
      return "audio/mp4";
    case ".flac":
      return "audio/flac";
    case ".ogg":
      return "audio/ogg";
    case ".wav":
      return "audio/wav";
    default:
      return "application/octet-stream";
  }
};

/** Ingest one file. Returns the track id, or null if the file isn't audio. */
const ingestOne = async (file: string): Promise<string | null> => {
  const ext = extname(file);
  if (!ACCEPTED.has(ext.toLowerCase())) return null;

  const filePath = join(TRACKS_DIR, file);
  const buffer = await readFile(filePath);
  const meta = await extractMetadata(buffer, parse(file).name, mimeFor(ext));

  const storageKey = `audio/${file}`;

  const existing = await prisma.track.findUnique({ where: { storageKey } });
  if (existing) {
    console.log(`✓ Skip (already ingested): ${existing.title}`);
    return existing.id;
  }

  console.log(`↑ Uploading: ${file}`);
  await putObject(storageKey, buffer, mimeFor(ext));

  const track = await prisma.track.create({
    data: {
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      durationSec: meta.durationSec,
      genre: meta.genre,
      key: meta.key,
      storageKey,
      isLocal: false,
    },
  });

  if (meta.picture) {
    const artworkKey = `artwork/${track.id}.${meta.picture.ext}`;
    console.log(`  ↑ Artwork: ${artworkKey}`);
    const artworkUrl = await putObject(
      artworkKey,
      meta.picture.data,
      meta.picture.mime,
    );
    await prisma.track.update({
      where: { id: track.id },
      data: { artworkUrl },
    });
  }

  console.log(`  ✓ ${meta.artist} — ${meta.title}`);
  return track.id;
};

type PlaylistTarget =
  | { kind: "none" }
  | { kind: "new" }
  | { kind: "existing"; id: string };

/** Ask whether to drop the ingested tracks into a playlist. */
const choosePlaylist = async (): Promise<string | null> => {
  const playlists = await prisma.playlist.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, _count: { select: { tracks: true } } },
  });

  const choices: Choice<PlaylistTarget>[] = [
    { label: "Library only — don't add to a playlist", value: { kind: "none" } },
    ...playlists.map(
      (p): Choice<PlaylistTarget> => ({
        label: p.name,
        hint: `${p._count.tracks} track(s)`,
        value: { kind: "existing", id: p.id },
      }),
    ),
    { label: "Create a new playlist…", value: { kind: "new" } },
  ];

  const target = await radioSelect(
    "Add ingested tracks to a playlist?",
    choices,
  );

  if (target.kind === "none") return null;
  if (target.kind === "existing") return target.id;

  const name = await textInput("New playlist name", { default: "New Playlist" });
  const created = await prisma.playlist.create({ data: { name } });
  console.log(`+ Created playlist "${created.name}"`);
  return created.id;
};

/** Append tracks to a playlist, skipping any already present. */
const addToPlaylist = async (playlistId: string, trackIds: string[]) => {
  const existing = await prisma.playlistTrack.findMany({
    where: { playlistId },
    select: { trackId: true, order: true },
  });
  const present = new Set(existing.map((e) => e.trackId));
  let order = existing.reduce((max, e) => Math.max(max, e.order + 1), 0);

  let added = 0;
  for (const trackId of trackIds) {
    if (present.has(trackId)) continue;
    await prisma.playlistTrack.create({
      data: { playlistId, trackId, order: order++ },
    });
    present.add(trackId);
    added++;
  }
  console.log(`♪ Added ${added} new track(s) to the playlist.`);
};

const main = async () => {
  let files: string[];
  try {
    files = await readdir(TRACKS_DIR);
  } catch {
    console.error(`Drop audio files in ${TRACKS_DIR} and re-run.`);
    process.exit(1);
  }

  const audioFiles = files.filter((f) => ACCEPTED.has(extname(f).toLowerCase()));
  if (audioFiles.length === 0) {
    console.error(`No audio files found in ${TRACKS_DIR}.`);
    process.exit(1);
  }

  console.log(`Found ${audioFiles.length} audio file(s) in ${TRACKS_DIR}\n`);
  const playlistId = await choosePlaylist();

  console.log();
  const trackIds: string[] = [];
  for (const file of audioFiles) {
    try {
      const id = await ingestOne(file);
      if (id) trackIds.push(id);
    } catch (err) {
      console.error(`✗ ${file}:`, (err as Error).message);
    }
  }

  if (playlistId && trackIds.length > 0) {
    console.log();
    await addToPlaylist(playlistId, trackIds);
  }

  await prisma.$disconnect();
};

await main();
