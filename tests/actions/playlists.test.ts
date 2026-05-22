import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, revalidateTagMock, revalidatePathMock } = vi.hoisted(() => ({
  prismaMock: {
    playlist: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    playlistTrack: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
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
  attachTrackAction,
  createPlaylistAction,
  detachTrackAction,
  detachTracksAction,
  removePlaylistAction,
  renamePlaylistAction,
  reorderPlaylistTracksAction,
} from "@/app/_actions/playlists";

describe("createPlaylistAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.playlist.create.mockResolvedValue({ id: "pl-new" });
  });

  it("creates playlist with default name", async () => {
    const result = await createPlaylistAction();
    expect(result).toEqual({ ok: true, id: "pl-new" });
    expect(prismaMock.playlist.create).toHaveBeenCalledWith({
      data: { name: "New Playlist" },
      select: { id: true },
    });
  });

  it("creates playlist with custom name", async () => {
    await createPlaylistAction("Custom");
    expect(prismaMock.playlist.create).toHaveBeenCalledWith({
      data: { name: "Custom" },
      select: { id: true },
    });
  });
});

describe("renamePlaylistAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.playlist.update.mockResolvedValue({});
  });

  it("rejects empty or whitespace-only names", async () => {
    expect(await renamePlaylistAction("pl-1", "")).toEqual({
      ok: false,
      error: "Name cannot be empty",
    });
    expect(await renamePlaylistAction("pl-1", "   ")).toEqual({
      ok: false,
      error: "Name cannot be empty",
    });
  });

  it("trims and updates name", async () => {
    const result = await renamePlaylistAction("pl-1", "  Renamed  ");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.playlist.update).toHaveBeenCalledWith({
      where: { id: "pl-1" },
      data: { name: "Renamed" },
    });
  });
});

describe("attachTrackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.playlistTrack.findUnique.mockResolvedValue(null);
    prismaMock.playlistTrack.create.mockResolvedValue({});
  });

  it("rejects duplicate track", async () => {
    prismaMock.playlistTrack.findUnique.mockResolvedValue({ id: "existing" });
    const result = await attachTrackAction("pl-1", "t-1");
    expect(result).toEqual({
      ok: false,
      error: "Track is already in this playlist",
    });
  });

  it("assigns order 1 for first track", async () => {
    prismaMock.playlistTrack.findFirst.mockResolvedValue(null);
    await attachTrackAction("pl-1", "t-1");
    expect(prismaMock.playlistTrack.create).toHaveBeenCalledWith({
      data: { playlistId: "pl-1", trackId: "t-1", order: 1 },
    });
  });

  it("appends after last order", async () => {
    prismaMock.playlistTrack.findFirst.mockResolvedValue({ order: 3 });
    await attachTrackAction("pl-1", "t-2");
    expect(prismaMock.playlistTrack.create).toHaveBeenCalledWith({
      data: { playlistId: "pl-1", trackId: "t-2", order: 4 },
    });
  });
});

describe("reorderPlaylistTracksAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockResolvedValue([]);
  });

  it("returns ok for empty array", async () => {
    const result = await reorderPlaylistTracksAction("pl-1", []);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("updates order by array index", async () => {
    await reorderPlaylistTracksAction("pl-1", ["t-a", "t-b"]);
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
  });
});

describe("detachTrackAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.playlistTrack.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("delegates to detachTracksAction", async () => {
    const result = await detachTrackAction("pl-1", "t-1");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.playlistTrack.deleteMany).toHaveBeenCalledWith({
      where: { playlistId: "pl-1", trackId: { in: ["t-1"] } },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/playlist/pl-1");
  });
});

describe("detachTracksAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.playlistTrack.deleteMany.mockResolvedValue({ count: 2 });
  });

  it("returns ok for empty array", async () => {
    const result = await detachTracksAction("pl-1", []);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.playlistTrack.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes multiple join rows", async () => {
    const result = await detachTracksAction("pl-1", ["t-1", "t-2"]);
    expect(result).toEqual({ ok: true });
    expect(prismaMock.playlistTrack.deleteMany).toHaveBeenCalledWith({
      where: { playlistId: "pl-1", trackId: { in: ["t-1", "t-2"] } },
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/playlist/pl-1");
  });
});

describe("removePlaylistAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockResolvedValue([]);
  });

  it("deletes tracks then playlist in transaction", async () => {
    const result = await removePlaylistAction("pl-1");
    expect(result).toEqual({ ok: true });
    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    const ops = prismaMock.$transaction.mock.calls[0]?.[0];
    expect(ops).toHaveLength(2);
  });
});
