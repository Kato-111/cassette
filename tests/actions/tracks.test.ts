import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  prismaMock: {
    track: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  revalidateTagMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({
  revalidateTag: revalidateTagMock,
  revalidatePath: revalidatePathMock,
}));

import {
  reorderLibraryTracksAction,
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

  it("parses BPM: empty to null, valid number, invalid error", async () => {
    const empty = new FormData();
    empty.set("trackId", "t1");
    empty.set("field", "bpm");
    empty.set("bpm", "  ");
    await updateTrackFieldAction(null, empty);
    expect(prismaMock.track.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { bpm: null },
    });

    const valid = new FormData();
    valid.set("trackId", "t1");
    valid.set("field", "bpm");
    valid.set("bpm", "120");
    await updateTrackFieldAction(null, valid);
    expect(prismaMock.track.update).toHaveBeenCalledWith({
      where: { id: "t1" },
      data: { bpm: 120 },
    });

    const invalid = new FormData();
    invalid.set("trackId", "t1");
    invalid.set("field", "bpm");
    invalid.set("bpm", "abc");
    const result = await updateTrackFieldAction(null, invalid);
    expect(result).toEqual({ ok: false, error: "BPM must be a number" });
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
