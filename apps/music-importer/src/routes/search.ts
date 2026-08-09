import { Hono } from "hono";
import { searchYoutubeMusic } from "../importers/youtube.ts";
import { parseSearchLimit } from "../lib/parse-search-limit.ts";
import { apiKeyMiddleware } from "../middleware/auth.ts";

export const searchRoutes = new Hono();

searchRoutes.use("*", apiKeyMiddleware);

/**
 * Search the YouTube Music Songs catalog through YouTube.js. Results use the
 * ImportItem shape, so clients can pass a selected result straight to import.
 */
searchRoutes.get("/search", async (c) => {
  const query = c.req.query("q")?.trim();
  if (!query) {
    return c.json({ error: "Missing q query parameter" }, 400);
  }

  let limit: number;
  try {
    limit = parseSearchLimit(c.req.query("limit"));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  try {
    const results = await searchYoutubeMusic(query, limit);
    return c.json({ results });
  } catch (err) {
    console.error("YouTube search failed", err);
    return c.json({ error: "YouTube search failed" }, 502);
  }
});
