import { Hono } from "hono";
import { cors } from "hono/cors";
import { config } from "./lib/config.ts";
import { healthRoutes } from "./routes/health.ts";
import { importRoutes } from "./routes/import.ts";
import { searchRoutes } from "./routes/search.ts";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return config.allowedOrigins[0] ?? "";
      return config.allowedOrigins.includes(origin) ? origin : "";
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  }),
);

app.route("/", healthRoutes);
app.route("/", importRoutes);
app.route("/", searchRoutes);

console.log(`Starting API on port ${config.port}`);

Bun.serve({
  hostname: "0.0.0.0",
  port: config.port,
  fetch: app.fetch,
});
