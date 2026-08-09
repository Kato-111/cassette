import { describe, expect, it } from "vitest";
import { resolveYtdlpAlbum } from "../src/importers/youtube.ts";

describe("resolveYtdlpAlbum", () => {
  it("prefers entry album over playlist title", () => {
    expect(
      resolveYtdlpAlbum({ album: "The Eminem Show" }, "Random Mix"),
    ).toBe("The Eminem Show");
  });

  it("falls back to series when album is missing", () => {
    expect(resolveYtdlpAlbum({ series: "Curtain Call" }, "Playlist")).toBe(
      "Curtain Call",
    );
  });

  it("uses playlist title when entry has no album metadata", () => {
    expect(resolveYtdlpAlbum({}, "Greatest Hits")).toBe("Greatest Hits");
  });

  it("returns undefined when no album metadata is available", () => {
    expect(resolveYtdlpAlbum({}, undefined)).toBeUndefined();
    expect(resolveYtdlpAlbum({}, "   ")).toBeUndefined();
  });
});
