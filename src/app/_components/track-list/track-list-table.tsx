"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useTrackList } from "@/contexts/track-list-context";
import { TrackRow } from "./track-row";

export const TrackListTableBody = () => {
  const { tracks, query, reorderable } = useTrackList();

  if (tracks.length === 0) {
    return null;
  }

  const rows = tracks.map((track, i) => (
    <TrackRow key={track.id} track={track} index={i} query={query} />
  ));

  if (reorderable) {
    return (
      <SortableContext
        items={tracks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {rows}
      </SortableContext>
    );
  }

  return rows;
};
