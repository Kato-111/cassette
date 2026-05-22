import type { TrackListRemoveScope } from "./types";

export const truncateAlbumLabel = (album: string, maxLen = 24) =>
  album.length > maxLen ? `${album.slice(0, maxLen)}…` : album;

export const removeTrackLabel = (scope: TrackListRemoveScope) =>
  scope === "playlist" ? "Remove from playlist" : "Remove from library";

export const removeAlbumLabel = (scope: TrackListRemoveScope, album: string) =>
  scope === "playlist"
    ? `Remove "${truncateAlbumLabel(album)}" from playlist`
    : `Remove "${truncateAlbumLabel(album)}" from library`;
