import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, putObjectMock, extractMetadataMock, revalidateTagMock, revalidatePathMock } =
  vi.hoisted(() => ({
    prismaMock: {
      track: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      playlist: {
        update: vi.fn(),
      },
    },
    putObjectMock: vi.fn(),
    extractMetadataMock: vi.fn(),
    revalidateTagMock: vi.fn(),
    revalidatePathMock: vi.fn(),
  }));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/r2", () => ({ putObject: putObjectMock }));
vi.mock("@/lib/metadata", () => ({ extractMetadata: extractMetadataMock }));
vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

import {
  uploadPlaylistCoverAction,
  uploadTrackAction,
  uploadTrackArtworkAction,
} from "@/app/_actions/uploads";

const makeFile = (name: string, size: number, type = "audio/mpeg") => {
  const buf = new Uint8Array(Math.max(size, 1));
  const file = new File([buf], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("uploadTrackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.track.findUnique.mockResolvedValue(null);
    prismaMock.track.findFirst.mockResolvedValue({ libraryOrder: 2 });
    prismaMock.track.create.mockResolvedValue({ id: "track-new", title: "Song" });
    prismaMock.track.update.mockResolvedValue({});
    putObjectMock.mockResolvedValue("https://cdn.example/audio/x.mp3");
    extractMetadataMock.mockResolvedValue({
      title: "Song",
      artist: "Artist",
      album: null,
      durationSec: 100,
      genre: null,
      bpm: null,
      key: null,
      picture: null,
    });
  });

  it("rejects missing file", async () => {
    const fd = new FormData();
    const result = await uploadTrackAction(null, fd);
    expect(result).toEqual({ ok: false, error: "Missing file" });
  });

  it("rejects empty file", async () => {
    const fd = new FormData();
    fd.set("file", makeFile("a.mp3", 0));
    const result = await uploadTrackAction(null, fd);
    expect(result).toEqual({ ok: false, error: "File is empty" });
  });

  it("rejects files over 50MB", async () => {
    const fd = new FormData();
    fd.set("file", makeFile("big.mp3", 51 * 1024 * 1024));
    const result = await uploadTrackAction(null, fd);
    expect(result).toEqual({ ok: false, error: "File exceeds 50MB limit" });
  });

  it("rejects unsupported file type", async () => {
    const fd = new FormData();
    fd.set("file", makeFile("notes.txt", 100, "text/plain"));
    const result = await uploadTrackAction(null, fd);
    expect(result).toEqual({ ok: false, error: "Unsupported file type" });
  });

  it("uploads track and sets libraryOrder to last + 1", async () => {
    const fd = new FormData();
    fd.set("file", makeFile("song.mp3", 1000));
    const result = await uploadTrackAction(null, fd);
    expect(result).toEqual({ ok: true, trackId: "track-new", title: "Song" });
    expect(putObjectMock).toHaveBeenCalled();
    expect(prismaMock.track.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ libraryOrder: 3 }),
      }),
    );
  });

  it("uploads artwork when metadata includes picture", async () => {
    extractMetadataMock.mockResolvedValue({
      title: "Song",
      artist: "Artist",
      album: null,
      durationSec: 100,
      genre: null,
      bpm: null,
      key: null,
      picture: { data: Buffer.from([1]), mime: "image/jpeg", ext: "jpg" },
    });
    const fd = new FormData();
    fd.set("file", makeFile("song.mp3", 1000));
    await uploadTrackAction(null, fd);
    expect(putObjectMock).toHaveBeenCalledTimes(2);
    expect(prismaMock.track.update).toHaveBeenCalled();
  });
});

describe("uploadPlaylistCoverAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    putObjectMock.mockResolvedValue("https://cdn.example/cover.jpg");
    prismaMock.playlist.update.mockResolvedValue({});
  });

  it("rejects missing playlistId or file", async () => {
    expect(await uploadPlaylistCoverAction(null, new FormData())).toEqual({
      ok: false,
      error: "Missing playlistId",
    });
  });

  it("rejects files over 5MB", async () => {
    const fd = new FormData();
    fd.set("playlistId", "pl-1");
    fd.set("file", makeFile("cover.jpg", 6 * 1024 * 1024, "image/jpeg"));
    expect(await uploadPlaylistCoverAction(null, fd)).toEqual({
      ok: false,
      error: "File exceeds 5MB limit",
    });
  });

  it("uploads cover and returns URL", async () => {
    const fd = new FormData();
    fd.set("playlistId", "pl-1");
    fd.set("file", makeFile("cover.jpg", 1000, "image/jpeg"));
    const result = await uploadPlaylistCoverAction(null, fd);
    expect(result).toEqual({
      ok: true,
      coverUrl: "https://cdn.example/cover.jpg",
    });
  });
});

describe("uploadTrackArtworkAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    putObjectMock.mockResolvedValue("https://cdn.example/art.jpg");
    prismaMock.track.update.mockResolvedValue({});
  });

  it("rejects missing trackId or file", async () => {
    expect(await uploadTrackArtworkAction(null, new FormData())).toEqual({
      ok: false,
      error: "Missing trackId",
    });
  });

  it("rejects files over 5MB", async () => {
    const fd = new FormData();
    fd.set("trackId", "t-1");
    fd.set("file", makeFile("art.jpg", 6 * 1024 * 1024, "image/jpeg"));
    expect(await uploadTrackArtworkAction(null, fd)).toEqual({
      ok: false,
      error: "File exceeds 5MB limit",
    });
  });

  it("uploads artwork and returns URL", async () => {
    const fd = new FormData();
    fd.set("trackId", "t-1");
    fd.set("file", makeFile("art.jpg", 1000, "image/jpeg"));
    const result = await uploadTrackArtworkAction(null, fd);
    expect(result).toEqual({
      ok: true,
      artworkUrl: "https://cdn.example/art.jpg",
    });
  });
});
