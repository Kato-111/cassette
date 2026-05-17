import "dotenv/config";
import { listObjects } from "../src/lib/r2";

const main = async () => {
  const objects = await listObjects();
  for (const o of objects) {
    const size = o.Size?.toLocaleString() ?? "?";
    console.log(`${size.padStart(12)}  ${o.Key}`);
  }
  console.log(`\n${objects.length} object(s) total.`);
};

await main();
