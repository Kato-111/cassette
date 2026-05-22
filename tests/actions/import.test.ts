import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { revalidateTagMock, revalidatePathMock, fetchMock } = vi.hoisted(() => ({
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

import {
  getImportJobStatusAction,
  startImportFromUrlAction,
} from "@/app/_actions/import";

const ORIGINAL_ENV = process.env;

describe("startImportFromUrlAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      MUSIC_IMPORTER_URL: "http://localhost:8787",
      IMPORTER_API_KEY: "test-key",
    };
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns error when importer is not configured", async () => {
    delete process.env.MUSIC_IMPORTER_URL;
    const result = await startImportFromUrlAction("https://youtube.com/watch?v=abc");
    expect(result).toEqual({ ok: false, error: "URL import is not configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns error for empty url", async () => {
    const result = await startImportFromUrlAction("  ");
    expect(result).toEqual({ ok: false, error: "Missing URL" });
  });

  it("posts to importer with auth, body, and limit query", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({ jobId: "job-1" }),
    });

    const result = await startImportFromUrlAction(
      "https://www.youtube.com/playlist?list=PLtest",
      { playlistId: "507f1f77bcf86cd799439011", limit: 2 },
    );

    expect(result).toEqual({ ok: true, jobId: "job-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8787/import?limit=2",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: "https://www.youtube.com/playlist?list=PLtest",
          playlistId: "507f1f77bcf86cd799439011",
        }),
      }),
    );
  });

  it("surfaces importer errors", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Unsupported import URL" }),
    });

    const result = await startImportFromUrlAction("https://example.com/x");
    expect(result).toEqual({ ok: false, error: "Unsupported import URL" });
  });
});

describe("getImportJobStatusAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...ORIGINAL_ENV,
      MUSIC_IMPORTER_URL: "http://localhost:8787/",
      IMPORTER_API_KEY: "test-key",
    };
    global.fetch = fetchMock;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("fetches job status with auth", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "job-1",
        source: "youtube",
        sourceUrl: "https://youtube.com/watch?v=abc",
        status: "processing",
        total: 2,
        completed: 1,
        failed: 0,
        trackIds: ["t1"],
        playlistId: null,
        limit: 2,
        errors: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:01.000Z",
      }),
    });

    const result = await getImportJobStatusAction("job-1");
    expect(result.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8787/import/job-1",
      expect.objectContaining({
        headers: { Authorization: "Bearer test-key" },
        cache: "no-store",
      }),
    );
    if (result.ok) {
      expect(result.job.status).toBe("processing");
      expect(result.job.completed).toBe(1);
    }
    expect(revalidateTagMock).not.toHaveBeenCalled();
  });

  it("revalidates when job is completed", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "job-1",
        source: "youtube",
        sourceUrl: "https://youtube.com/watch?v=abc",
        status: "completed",
        total: 1,
        completed: 1,
        failed: 0,
        trackIds: ["t1"],
        playlistId: "507f1f77bcf86cd799439011",
        limit: null,
        errors: [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:02.000Z",
      }),
    });

    await getImportJobStatusAction("job-1");

    expect(revalidateTagMock).toHaveBeenCalledWith("tracks", "max");
    expect(revalidateTagMock).toHaveBeenCalledWith("playlists", "max");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePathMock).toHaveBeenCalledWith("/favorites");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/playlist/507f1f77bcf86cd799439011",
    );
  });
});
