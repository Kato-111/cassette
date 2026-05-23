import "dotenv/config";
import { extname } from "node:path";
import { prisma } from "../src/lib/db";
import { extractMetadata } from "../src/lib/metadata";
import {
  getObject,
  listObjects,
  putObject,
  streamToBuffer,
} from "../src/lib/r2";

const AUDIO_EXTS = new Set([".mp3", ".m4a", ".flac", ".ogg", ".wav"]);

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

const stripExt = (filename: string): string => {
  const i = filename.lastIndexOf(".");
  return i > 0 ? filename.slice(0, i) : filename;
};

const baseName = (key: string): string => {
  const lastSlash = key.lastIndexOf("/");
  return lastSlash >= 0 ? key.slice(lastSlash + 1) : key;
};

const ARTWORK_PREFIX = "artwork/";

const syncOne = async (key: string, size: number) => {
  const ext = extname(key).toLowerCase();
  if (!AUDIO_EXTS.has(ext)) return false;

  const existing = await prisma.track.findUnique({ where: { storageKey: key } });
  if (existing) {
    console.log(`✓ Skip (already linked): ${existing.title}`);
    return false;
  }

  console.log(`↓ Fetching ${baseName(key)} (${size.toLocaleString()} B)…`);
  const obj = await getObject(key);
  const buffer = await streamToBuffer(obj.Body);

  const fallbackTitle = stripExt(baseName(key)).replace(/\s*\[[^\]]+\]\s*$/, "");
  const meta = await extractMetadata(buffer, fallbackTitle, mimeFor(ext));

  const track = await prisma.track.create({
    data: {
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      durationSec: meta.durationSec,
      genre: meta.genre,
      key: meta.key,
      storageKey: key,
      isLocal: false,
    },
  });

  if (meta.picture) {
    const artworkKey = `${ARTWORK_PREFIX}${track.id}.${meta.picture.ext}`;
    console.log(`  ↑ Artwork → ${artworkKey}`);
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

  console.log(`  + ${meta.artist} — ${meta.title}`);
  return true;
};

const main = async () => {
  const objects = await listObjects();
  console.log(`Found ${objects.length} object(s) in bucket.`);

  let registered = 0;
  for (const o of objects) {
    if (!o.Key) continue;
    if (o.Key.startsWith(ARTWORK_PREFIX)) continue;
    if (o.Key.startsWith("covers/")) continue;
    try {
      if (await syncOne(o.Key, o.Size ?? 0)) registered++;
    } catch (err) {
      console.error(`✗ ${o.Key}:`, (err as Error).message);
    }
  }

  console.log(`\nRegistered ${registered} new track(s).`);
  await prisma.$disconnect();
};

await main();
