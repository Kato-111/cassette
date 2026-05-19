import "dotenv/config";
import { prisma } from "../src/lib/db";

const STARTER_PLAYLISTS = [
  "Late Night",
  "Workout",
  "Focus",
  "Drive",
  "Lo-fi",
];

const main = async () => {
  const tracks = await prisma.track.findMany({ select: { id: true } });
  if (tracks.length === 0) {
    console.error("No tracks found — run `bun run ingest` first.");
    process.exit(1);
  }

  for (const name of STARTER_PLAYLISTS) {
    const existing = await prisma.playlist.findFirst({ where: { name } });
    const playlist =
      existing ?? (await prisma.playlist.create({ data: { name } }));

    if (existing) {
      console.log(`= ${name} (already exists)`);
      continue;
    }

    const count = Math.min(
      tracks.length,
      Math.floor(Math.random() * 10) + 5,
    );
    const shuffled = [...tracks]
      .sort(() => Math.random() - 0.5)
      .slice(0, count);

    for (let i = 0; i < shuffled.length; i++) {
      await prisma.playlistTrack.create({
        data: {
          playlistId: playlist.id,
          trackId: shuffled[i].id,
          order: i,
        },
      });
    }
    console.log(`+ ${name} (${count} tracks)`);
  }

  await prisma.$disconnect();
};

await main();
