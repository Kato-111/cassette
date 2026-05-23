import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, parse } from "node:path";
import { prisma } from "../src/lib/db";
import { extractMetadata } from "../src/lib/metadata";
import { putObject } from "../src/lib/r2";

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

const ingestOne = async (file: string) => {
  const ext = extname(file);
  if (!ACCEPTED.has(ext.toLowerCase())) return;

  const filePath = join(TRACKS_DIR, file);
  const buffer = await readFile(filePath);
  const meta = await extractMetadata(buffer, parse(file).name, mimeFor(ext));

  const storageKey = `audio/${file}`;

  const existing = await prisma.track.findUnique({ where: { storageKey } });
  if (existing) {
    console.log(`✓ Skip (already ingested): ${meta.title}`);
    return;
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
};

const main = async () => {
  let files: string[];
  try {
    files = await readdir(TRACKS_DIR);
  } catch {
    console.error(`Drop audio files in ${TRACKS_DIR} and re-run.`);
    process.exit(1);
  }

  console.log(`Found ${files.length} entries in ${TRACKS_DIR}`);
  for (const file of files) {
    try {
      await ingestOne(file);
    } catch (err) {
      console.error(`✗ ${file}:`, (err as Error).message);
    }
  }
  await prisma.$disconnect();
};

await main();
