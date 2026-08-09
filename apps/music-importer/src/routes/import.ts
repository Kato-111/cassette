import { Hono } from "hono";
import { prisma } from "../lib/db.ts";
import { parseLimit } from "../lib/parse-limit.ts";
import { resolveProvider } from "../importers/registry.ts";
import { enqueueImportJob } from "../queue/import-queue.ts";
import { apiKeyMiddleware } from "../middleware/auth.ts";
import type { ImportJobError } from "../importers/types.ts";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

const parseErrors = (value: unknown): ImportJobError[] => {
  if (!Array.isArray(value)) return [];
  return value as ImportJobError[];
};

export const importRoutes = new Hono();

importRoutes.use("*", apiKeyMiddleware);

importRoutes.post("/import", async (c) => {
  let body: { url?: string; playlistId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const url = body.url?.trim();
  if (!url) {
    return c.json({ error: "Missing url" }, 400);
  }

  let provider;
  try {
    provider = resolveProvider(url);
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  const playlistId = body.playlistId?.trim() || null;
  if (playlistId) {
    if (!OBJECT_ID_RE.test(playlistId)) {
      return c.json({ error: "Invalid playlistId" }, 400);
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      select: { id: true },
    });
    if (!playlist) {
      return c.json({ error: "Playlist not found" }, 404);
    }
  }

  let limit: number | null = null;
  try {
    limit = parseLimit(c.req.query("limit"));
  } catch (err) {
    return c.json({ error: (err as Error).message }, 400);
  }

  const job = await prisma.importJob.create({
    data: {
      source: provider.source,
      sourceUrl: url,
      playlistId,
      limit,
      status: "pending",
    },
    select: { id: true },
  });

  await enqueueImportJob(job.id);

  return c.json({ jobId: job.id }, 202);
});

importRoutes.get("/import/:jobId", async (c) => {
  const jobId = c.req.param("jobId");

  if (!OBJECT_ID_RE.test(jobId)) {
    return c.json({ error: "Invalid jobId" }, 400);
  }

  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json({
    id: job.id,
    source: job.source,
    sourceUrl: job.sourceUrl,
    status: job.status,
    total: job.total,
    completed: job.completed,
    failed: job.failed,
    trackIds: job.trackIds,
    playlistId: job.playlistId,
    limit: job.limit,
    errors: parseErrors(job.errors),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  });
});
