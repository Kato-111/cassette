"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCurrentTrack, useIsPlaying } from "@/contexts/deck-context";
import { isTypingTarget } from "@/lib/keyboard";
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

  // Roving tabindex: one row has tabIndex=0 (the keyboard entry point).
  // activeRef is kept in sync for the key handler so rapid key presses don't
  // read stale state from a closed-over render.
  const [activeIndex, setActiveIndex] = useState(0);
  const activeRef = useRef(0);
  const setActive = (idx: number) => {
    activeRef.current = idx;
    setActiveIndex(idx);
  };

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

  // Update activeIndex whenever a row receives focus (handles clicks and
  // programmatic focus from outside the arrow-key handler).
  const handleFocus = (e: React.FocusEvent) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>("[data-row-index]");
    if (row?.dataset.rowIndex != null) setActive(Number(row.dataset.rowIndex));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    const isDown = e.key === "ArrowDown" || e.key === "j";
    const isUp = e.key === "ArrowUp" || e.key === "k";
    if (!isDown && !isUp) return;
    e.preventDefault();
    const next = Math.max(
      0,
      Math.min(activeRef.current + (isDown ? 1 : -1), tracks.length - 1),
    );
    setActive(next);
    virtualizer.scrollToIndex(next, { align: "auto" });
    // The target row may not be in the DOM yet (virtualizer renders after scroll).
    // requestAnimationFrame waits for React to flush the new virtual items.
    requestAnimationFrame(() => {
      scrollContainerRef.current
        ?.querySelector<HTMLElement>(`[data-row-index="${next}"]`)
        ?.focus();
    });
  };

  const measuredItems = virtualizer.getVirtualItems();
  const virtualItems = useMemo(
    () =>
      measuredItems.length > 0 || tracks.length === 0
        ? measuredItems
        : buildFallbackVirtualItems(tracks.length),
    [measuredItems, tracks.length],
  );

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
            tabIndex={virtualRow.index === activeIndex ? 0 : -1}
            query={query}
            isCurrent={currentTrack?.id === track.id}
            isPlaying={currentTrack?.id === track.id && isPlaying}
            isSelected={isSelected(track.id)}
          />
        );
      })}
      {paddingBottom > 0 ? <VirtualSpacerRow height={paddingBottom} /> : null}
    </>
  );

  return (
    <TableBody
      className="h-full"
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
    >
      {reorderable ? (
        <SortableContext
          items={tracks.map((t) => t.id)}
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
