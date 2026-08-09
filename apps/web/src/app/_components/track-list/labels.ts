import type { TrackListRemoveScope } from "./types";

export const removeTrackLabel = (scope: TrackListRemoveScope) =>
  scope === "playlist" ? "Remove from this playlist" : "Remove from library";
