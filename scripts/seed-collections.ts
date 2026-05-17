import "dotenv/config";
import { prisma } from "../src/lib/db";

const STARTER_COLLECTIONS = [
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

  for (const name of STARTER_COLLECTIONS) {
    const existing = await prisma.collection.findFirst({ where: { name } });
    const collection =
      existing ?? (await prisma.collection.create({ data: { name } }));

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
      await prisma.collectionTrack.create({
        data: {
          collectionId: collection.id,
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
