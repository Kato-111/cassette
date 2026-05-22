"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  importerAuthHeader,
  importerBaseUrl,
  isImporterConfigured,
} from "@/lib/importer";
import { CACHE_TAGS } from "@/lib/queries";

type ActionResult<T = unknown> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

export type ImportJobError = {
  sourceItemId: string;
  title: string;
  message: string;
};

export type ImportJobStatus = {
  id: string;
  source: string;
  sourceUrl: string;
  status: string;
  total: number;
  completed: number;
  failed: number;
  trackIds: string[];
  playlistId: string | null;
  limit: number | null;
  errors: ImportJobError[];
  createdAt: string;
  updatedAt: string;
};

const revalidateImportPaths = (playlistId?: string | null) => {
  revalidateTag(CACHE_TAGS.tracks, "max");
  revalidateTag(CACHE_TAGS.playlists, "max");
  revalidatePath("/", "layout");
  revalidatePath("/favorites");
  if (playlistId) {
    revalidatePath(`/playlist/${playlistId}`);
  }
};

export const startImportFromUrlAction = async (
  url: string,
  opts: { playlistId?: string; limit?: number } = {},
): Promise<ActionResult<{ jobId: string }>> => {
  if (!isImporterConfigured()) {
    return { ok: false, error: "URL import is not configured" };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing URL" };
  }

  try {
    const params = new URLSearchParams();
    if (opts.limit != null) {
      params.set("limit", String(opts.limit));
    }

    const query = params.toString();
    const endpoint = `${importerBaseUrl()}/import${query ? `?${query}` : ""}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: importerAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: trimmed,
        ...(opts.playlistId ? { playlistId: opts.playlistId } : {}),
      }),
    });

    const data = (await res.json()) as { jobId?: string; error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Import failed (${res.status})` };
    }
    if (!data.jobId) {
      return { ok: false, error: "Import service returned no jobId" };
    }

    return { ok: true, jobId: data.jobId };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};

export const getImportJobStatusAction = async (
  jobId: string,
): Promise<ActionResult<{ job: ImportJobStatus }>> => {
  if (!isImporterConfigured()) {
    return { ok: false, error: "URL import is not configured" };
  }

  if (!jobId.trim()) {
    return { ok: false, error: "Missing jobId" };
  }

  try {
    const res = await fetch(`${importerBaseUrl()}/import/${jobId}`, {
      headers: { Authorization: importerAuthHeader() },
      cache: "no-store",
    });

    const data = (await res.json()) as ImportJobStatus & { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? `Import status failed (${res.status})` };
    }

    const job: ImportJobStatus = {
      id: data.id,
      source: data.source,
      sourceUrl: data.sourceUrl,
      status: data.status,
      total: data.total,
      completed: data.completed,
      failed: data.failed,
      trackIds: data.trackIds,
      playlistId: data.playlistId,
      limit: data.limit,
      errors: data.errors ?? [],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    if (job.status === "completed" || job.status === "failed") {
      revalidateImportPaths(job.playlistId);
    }

    return { ok: true, job };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
};
