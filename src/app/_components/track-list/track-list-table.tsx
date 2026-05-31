"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo } from "react";
import { useCurrentTrack, useIsPlaying, usePlayFromContext } from "@/contexts/deck-context";
import { useTrackList } from "@/contexts/track-list-context";
import { TableBody } from "@/components/ui/table";
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
    isSelected,
  } = useTrackList();
  const currentTrack = useCurrentTrack();
  const isPlaying = useIsPlaying();
  const playFromContext = usePlayFromContext();

  const onPlay = useCallback(
    (index: number) => playFromContext(tracks, index),
    [playFromContext, tracks],
  );

  const virtualizer = useVirtualizer({
    count: tracks.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  // useEffect (not useLayoutEffect) to avoid triggering TanStack Virtual's
  // flushSync path synchronously during the commit phase, which caused a
  // 3.5 s INP block when the scroll element changed or track count changed.
  useEffect(() => {
    if (scrollContainerRef.current) {
      virtualizer.measure();
    }
  }, [scrollContainerRef, tracks.length, virtualizer]);

  const measuredItems = virtualizer.getVirtualItems();
  const virtualItems = useMemo(
    () =>
      measuredItems.length > 0 || tracks.length === 0
        ? measuredItems
        : buildFallbackVirtualItems(Math.min(tracks.length, OVERSCAN * 3)),
    [measuredItems, tracks.length],
  );

  const sortableIds = useMemo(() => tracks.map((t) => t.id), [tracks]);

  if (tracks.length === 0) {
    return <TableBody className="h-full" />;
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
            isSelected={isSelected(track.id)}
            onPlay={onPlay}
          />
        );
      })}
      {paddingBottom > 0 ? <VirtualSpacerRow height={paddingBottom} /> : null}
    </>
  );

  return (
    <TableBody className="h-full">
      {reorderable ? (
        <SortableContext
          items={sortableIds}
          strategy={verticalListSortingStrategy}
        >
          {rows}
        </SortableContext>
      ) : (
        rows
      )}
    </TableBody>
  );
};
