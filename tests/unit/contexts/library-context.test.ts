import type { Playlist } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { libraryReducer } from "@/contexts/library-context";

const makePlaylist = (overrides: Partial<Playlist> = {}): Playlist => ({
  id: "pl-1",
  name: "My Playlist",
  coverUrl: null,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
  ...overrides,
});

describe("libraryReducer", () => {
  it("upsert adds new playlist at front", () => {
    const existing = makePlaylist({ id: "pl-old", name: "Old" });
    const incoming = makePlaylist({ id: "pl-new", name: "New" });
    const next = libraryReducer([existing], {
      type: "upsert",
      playlist: incoming,
    });
    expect(next).toEqual([incoming, existing]);
  });

  it("upsert replaces existing playlist by id", () => {
    const original = makePlaylist({ id: "pl-1", name: "Before" });
    const updated = makePlaylist({ id: "pl-1", name: "After" });
    const next = libraryReducer([original], {
      type: "upsert",
      playlist: updated,
    });
    expect(next).toEqual([updated]);
  });

  it("patch merges partial fields", () => {
    const playlist = makePlaylist({ id: "pl-1", name: "Before" });
    const next = libraryReducer([playlist], {
      type: "patch",
      id: "pl-1",
      patch: { name: "After" },
    });
    expect(next[0]?.name).toBe("After");
    expect(next[0]?.id).toBe("pl-1");
  });

  it("remove filters by id", () => {
    const a = makePlaylist({ id: "pl-a" });
    const b = makePlaylist({ id: "pl-b" });
    const next = libraryReducer([a, b], { type: "remove", id: "pl-a" });
    expect(next).toEqual([b]);
  });
});
