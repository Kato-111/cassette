import type { Context, Next } from "hono";
import { config } from "../lib/config.ts";

export const apiKeyMiddleware = async (c: Context, next: Next) => {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length).trim()
    : header?.trim();
  const expected = config.importerApiKey;

  if (!token || token !== expected) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
};
