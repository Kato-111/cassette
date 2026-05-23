"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useDeck } from "@/contexts/deck-context";
import { useTrackList } from "@/contexts/track-list-context";
import { TRACK_ROW_COLUMN_COUNT, TrackRow } from "./track-row";

const ROW_HEIGHT = 57;
const OVERSCAN = 10;

const VirtualSpacerRow = ({ height }: { height: number }) => (
  <tr aria-hidden="true">
    <td
      colSpan={TRACK_ROW_COLUMN_COUNT}
      style={{ height, padding: 0, border: 0, lineHeight: 0 }}
    />
  </tr>
);

const buildFallbackVirtualItems = (count: number): VirtualItem[] =>
  Array.from({ length: count }, (_, index) => ({
    index,
    key: index,
    start: index * ROW_HEIGHT,
    end: (index + 1) * ROW_HEIGHT,
    size: ROW_HEIGHT,
    lane: 0,
  }));

export const TrackListTableBody = () => {
  const {
    tracks,
    query,
    reorderable,
    scrollContainerRef,
    focusedIndex,
    isSelected,
    registerScrollToIndex,
  } = useTrackList();
  const { currentTrack, isPlaying } = useDeck();

  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      virtualizer.measure();
    }
  }, [virtualizer, scrollContainerRef, tracks.length]);

  useEffect(() => {
    registerScrollToIndex((index) => {
      virtualizer.scrollToIndex(index, { align: "auto" });
    });
    return () => registerScrollToIndex(null);
  }, [virtualizer, registerScrollToIndex]);

  const measuredItems = virtualizer.getVirtualItems();
  const virtualItems = useMemo(
    () =>
      measuredItems.length > 0 || tracks.length === 0
        ? measuredItems
        : buildFallbackVirtualItems(tracks.length),
    [measuredItems, tracks.length],
  );

  if (tracks.length === 0) {
    return null;
  }

  const usingFallback = measuredItems.length === 0;
  const paddingTop = usingFallback ? 0 : (virtualItems[0]?.start ?? 0);
  const paddingBottom = usingFallback
    ? 0
    : virtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? 0);

  const rows = (
    <>
      {paddingTop > 0 ? <VirtualSpacerRow height={paddingTop} /> : null}
      {virtualItems.map((virtualRow) => {
        const track = tracks[virtualRow.index];
        return (
          <TrackRow
            key={track.id}
            track={track}
            index={virtualRow.index}
            query={query}
            isCurrent={currentTrack?.id === track.id}
            isPlaying={currentTrack?.id === track.id && isPlaying}
            isFocused={focusedIndex === virtualRow.index}
            isSelected={isSelected(track.id)}
          />
        );
      })}
      {paddingBottom > 0 ? <VirtualSpacerRow height={paddingBottom} /> : null}
    </>
  );

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
