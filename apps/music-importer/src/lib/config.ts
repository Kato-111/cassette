import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const envPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
  ".env",
);
loadEnv({ path: envPath });

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value.trim().replace(/^["']|["']$/g, "");
};

export const config = {
  port: Number.parseInt(process.env.PORT ?? "8787", 10),
  mongoUrl: requireEnv("MONGO_URL"),
  redisUrl: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  importerApiKey: requireEnv("IMPORTER_API_KEY"),
  tempDir: process.env.TEMP_DIR ?? "/tmp/import",
  maxConcurrentImports: Number.parseInt(
    process.env.MAX_CONCURRENT_IMPORTS ?? "1",
    10,
  ),
  maxConcurrentItems: Number.parseInt(
    process.env.MAX_CONCURRENT_ITEMS ?? "3",
    10,
  ),
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ??
    "http://localhost:3000,https://cassetta.vercel.app"
  )
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  r2: {
    accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY"),
    bucket: requireEnv("R2_BUCKET_NAME"),
    publicBase: requireEnv("R2_PUBLIC_URL"),
    accountId: process.env.R2_ACCOUNT_ID,
    endpoint: process.env.R2_ENDPOINT,
  },
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID?.trim(),
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET?.trim(),
  },
} as const;
