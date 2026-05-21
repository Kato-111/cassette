import { beforeEach, describe, expect, it, vi } from "vitest";

const { parseBufferMock } = vi.hoisted(() => ({
  parseBufferMock: vi.fn(),
}));

vi.mock("music-metadata", () => ({
  parseBuffer: parseBufferMock,
}));

import { extractMetadata } from "@/lib/metadata";

describe("extractMetadata", () => {
  beforeEach(() => {
    parseBufferMock.mockReset();
  });

  it("uses tag title, artist, and album when present", async () => {
    parseBufferMock.mockResolvedValue({
      common: {
        title: "  Tagged Title  ",
        artist: "  Tagged Artist  ",
        album: "  Tagged Album  ",
        genre: ["Rock"],
        bpm: 128.4,
      },
      format: { duration: 200.6 },
    });

    const result = await extractMetadata(Buffer.from("x"), "Fallback", "audio/mpeg");
    expect(result.title).toBe("Tagged Title");
    expect(result.artist).toBe("Tagged Artist");
    expect(result.album).toBe("Tagged Album");
    expect(result.genre).toBe("Rock");
    expect(result.bpm).toBe(128);
    expect(result.durationSec).toBe(201);
  });

  it("falls back to fallbackTitle and Unknown Artist", async () => {
    parseBufferMock.mockResolvedValue({
      common: {},
      format: { duration: 0 },
    });

    const result = await extractMetadata(Buffer.from("x"), "File Name", "audio/mpeg");
    expect(result.title).toBe("File Name");
    expect(result.artist).toBe("Unknown Artist");
    expect(result.album).toBeNull();
    expect(result.genre).toBeNull();
    expect(result.bpm).toBeNull();
  });

  it("extracts embedded picture", async () => {
    parseBufferMock.mockResolvedValue({
      common: {
        picture: [
          {
            data: Uint8Array.from([1, 2, 3]),
            format: "image/jpeg",
          },
        ],
      },
      format: { duration: 10 },
    });

    const result = await extractMetadata(Buffer.from("x"), "T", "audio/mpeg");
    expect(result.picture).toEqual({
      data: Buffer.from([1, 2, 3]),
      mime: "image/jpeg",
      ext: "jpeg",
    });
  });

  it("handles missing tags gracefully", async () => {
    parseBufferMock.mockResolvedValue({
      common: { picture: [] },
      format: {},
    });

    const result = await extractMetadata(Buffer.from("x"), "Untitled", "audio/mpeg");
    expect(result.picture).toBeNull();
    expect(result.durationSec).toBe(0);
    expect(result.key).toBeNull();
  });
});
