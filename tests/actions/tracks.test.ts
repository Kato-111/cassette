import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, revalidateTagMock, revalidatePathMock, deleteObjectMock } = vi.hoisted(() => ({
  prismaMock: {
    track: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    playlistTrack: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  deleteObjectMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/r2", () => ({ deleteObject: deleteObjectMock }));
vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

import {
  deleteTrackAction,
  deleteTracksAction,
  reorderLibraryTracksAction,
  toggleFavoriteAction,
  updateTrackFieldAction,
} from "@/app/_actions/tracks";

describe("updateTrackFieldAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.track.update.mockResolvedValue({});
  });

  it("returns error when trackId or field is missing", async () => {
    const fd = new FormData();
    const result = await updateTrackFieldAction(null, fd);
    expect(result).toEqual({ ok: false, error: "Missing trackId or field" });
  });

  it("returns error for unknown field", async () => {
    const fd = new FormData();
    fd.set("trackId", "t1");
    fd.set("field", "storageKey");
    fd.set("storageKey", "x");
    const result = await updateTrackFieldAction(null, fd);
    expect(result).toEqual({ ok: false, error: "Field not editable: storageKey" });
  });

  it("trims text fields and converts empty to null", async () => {
    const fd = new FormData();
    fd.set("trackId", "t1");
    fd.set("field", "title");
    fd.set("title", "  New Title  ");
    const result = await updateTrackFieldAction(null, fd);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.track.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { title: "New Title" },
    });
  });
});

describe("toggleFavoriteAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error for empty trackId", async () => {
    const result = await toggleFavoriteAction("  ");
    expect(result).toEqual({ ok: false, error: "Missing trackId" });
  });

  it("returns error when track not found", async () => {
    prismaMock.track.findUnique.mockResolvedValue(null);
    const result = await toggleFavoriteAction("t1");
    expect(result).toEqual({ ok: false, error: "Track not found" });
  });

  it("toggles false to true", async () => {
    prismaMock.track.findUnique.mockResolvedValue({ id: "t1", isFavorite: false });
    prismaMock.track.update.mockResolvedValue({ isFavorite: true });
    const result = await toggleFavoriteAction("t1");
    expect(result).toEqual({ ok: true, isFavorite: true });
    expect(prismaMock.track.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { isFavorite: true },
      select: { isFavorite: true },
    });
    expect(revalidateTagMock).toHaveBeenCalledWith("tracks", "max");
    expect(revalidateTagMock).toHaveBeenCalledWith("favorites", "max");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePathMock).toHaveBeenCalledWith("/favorites");
  });

  it("toggles true to false", async () => {
    prismaMock.track.findUnique.mockResolvedValue({ id: "t1", isFavorite: true });
    prismaMock.track.update.mockResolvedValue({ isFavorite: false });
    const result = await toggleFavoriteAction("t1");
    expect(result).toEqual({ ok: true, isFavorite: false });
    expect(prismaMock.track.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { isFavorite: false },
      select: { isFavorite: true },
    });
  });

  it("returns error on DB failure", async () => {
    prismaMock.track.findUnique.mockResolvedValue({ id: "t1", isFavorite: false });
    prismaMock.track.update.mockRejectedValue(new Error("db fail"));
    const result = await toggleFavoriteAction("t1");
    expect(result).toEqual({ ok: false, error: "db fail" });
  });
});

describe("reorderLibraryTracksAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockResolvedValue([]);
  });

  it("returns ok for empty array without DB call", async () => {
    const result = await reorderLibraryTracksAction([]);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("updates libraryOrder by array index", async () => {
    await reorderLibraryTracksAction(["a", "b", "c"]);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    const updates = prismaMock.$transaction.mock.calls[0]?.[0];
    expect(updates).toHaveLength(3);
  });

  it("returns error on DB failure", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("db fail"));
    const result = await reorderLibraryTracksAction(["a"]);
    expect(result).toEqual({ ok: false, error: "db fail" });
  });
});

describe("deleteTracksAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.track.findMany.mockResolvedValue([
      { id: "t-1", storageKey: "audio/one.mp3" },
      { id: "t-2", storageKey: "audio/two.mp3" },
    ]);
    prismaMock.$transaction.mockResolvedValue([]);
    deleteObjectMock.mockResolvedValue(undefined);
  });

  it("returns ok for empty array", async () => {
    const result = await deleteTracksAction([]);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("deletes playlist links then tracks and storage", async () => {
    const result = await deleteTracksAction(["t-1", "t-2"]);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(deleteObjectMock).toHaveBeenCalledWith("audio/one.mp3");
    expect(deleteObjectMock).toHaveBeenCalledWith("audio/two.mp3");
    expect(revalidateTagMock).toHaveBeenCalledWith("playlists", "max");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
    expect(revalidatePathMock).toHaveBeenCalledWith("/favorites");
  });
});

describe("deleteTrackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.track.findMany.mockResolvedValue([
      { id: "t-1", storageKey: "audio/one.mp3" },
    ]);
    prismaMock.$transaction.mockResolvedValue([]);
    deleteObjectMock.mockResolvedValue(undefined);
  });

  it("delegates to deleteTracksAction", async () => {
    const result = await deleteTrackAction("t-1");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.track.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["t-1"] } },
      select: { id: true, storageKey: true },
    });
  });
});
