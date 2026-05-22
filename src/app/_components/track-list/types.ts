export type TrackListView =
  | { kind: "library" }
  | { kind: "playlist"; playlistId: string }
  | { kind: "favorites" };

export type TrackListRemoveScope = "playlist" | "library";
