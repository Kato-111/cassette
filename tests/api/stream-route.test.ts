import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const { getObjectMock } = vi.hoisted(() => ({
  getObjectMock: vi.fn(),
}));

vi.mock("@/lib/r2", () => ({ getObject: getObjectMock }));

import { GET } from "@/app/api/stream/[...key]/route";

const makeRequest = (range?: string) =>
  ({
    headers: {
      get: (name: string) => (name.toLowerCase() === "range" ? (range ?? null) : null),
    },
  }) as NextRequest;

const makeBody = () => ({
  transformToWebStream: () => new ReadableStream(),
});

describe("GET /api/stream/[...key]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decodes multi-segment keys", async () => {
    getObjectMock.mockResolvedValue({
      Body: makeBody(),
      ContentType: "audio/mpeg",
      ContentLength: 100,
    });
    await GET(makeRequest(), {
      params: Promise.resolve({ key: ["audio", "foo%20bar.mp3"] }),
    });
    expect(getObjectMock).toHaveBeenCalledWith("audio/foo bar.mp3", undefined);
  });

  it("returns 200 with streaming headers when no range", async () => {
    getObjectMock.mockResolvedValue({
      Body: makeBody(),
      ContentType: "audio/mpeg",
      ContentLength: 100,
      ETag: '"abc"',
      LastModified: new Date("2024-01-01"),
    });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ key: ["audio", "test.mp3"] }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Accept-Ranges")).toBe("bytes");
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("Cache-Control")).toContain("immutable");
  });

  it("returns 206 when range header is present", async () => {
    getObjectMock.mockResolvedValue({
      Body: makeBody(),
      ContentType: "audio/mpeg",
      ContentLength: 50,
      ContentRange: "bytes 0-49/100",
    });
    const res = await GET(makeRequest("bytes=0-49"), {
      params: Promise.resolve({ key: ["audio", "test.mp3"] }),
    });
    expect(res.status).toBe(206);
    expect(res.headers.get("Content-Range")).toBe("bytes 0-49/100");
    expect(getObjectMock).toHaveBeenCalledWith("audio/test.mp3", "bytes=0-49");
  });

  it("returns 404 for NoSuchKey", async () => {
    getObjectMock.mockRejectedValue({ name: "NoSuchKey" });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ key: ["missing.mp3"] }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when body is missing", async () => {
    getObjectMock.mockResolvedValue({ Body: null });
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ key: ["empty.mp3"] }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 500 for other errors", async () => {
    getObjectMock.mockRejectedValue(new Error("boom"));
    const res = await GET(makeRequest(), {
      params: Promise.resolve({ key: ["bad.mp3"] }),
    });
    expect(res.status).toBe(500);
    expect(await res.text()).toBe("boom");
  });
});
