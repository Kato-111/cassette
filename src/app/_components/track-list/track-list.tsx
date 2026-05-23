"use client";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import type { Track } from "@prisma/client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Frame } from "@/components/ui/frame";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDeck } from "@/contexts/deck-context";
import { useLibrary } from "@/contexts/library-context";
import { TrackListProvider, useTrackList } from "@/contexts/track-list-context";
import { cn } from "@/lib/utils";
import { SelectionCommandBar } from "./selection-command-bar";
import { TrackListTableBody } from "./track-list-table";
import { TrackRowPresentation } from "./track-row";
import type { TrackListView } from "./types";
import { useTrackListKeyboard } from "./use-track-list-keyboard";

type TrackListInnerProps = {
  emptyMessage: string;
};

const TrackListInner = ({ emptyMessage }: TrackListInnerProps) => {
  const listRef = useRef<HTMLDivElement>(null);
  const dndContextId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const { registerPaneRef, setActivePane, currentTrack, isPlaying, addToUserQueue } =
    useDeck();
  const { playlists } = useLibrary();
  const {
    tracks,
    query,
    reorderable,
    selectable,
    inSelectionMode,
    allSelected,
    setSelectAll,
    selectedCount,
    isSelected,
    removeBarLabel,
    removePending,
    clearSelected,
    removeSelected,
    addSelectedToPlaylist,
    handleDragEnd,
    scrollContainerRef,
  } = useTrackList();

  const activeTrack =
    activeId != null ? tracks.find((t) => t.id === activeId) : undefined;
  const activeIndex = activeTrack != null ? tracks.indexOf(activeTrack) : -1;

  useEffect(() => {
    registerPaneRef("tracklist", listRef);
  }, [registerPaneRef]);

  const handleKeyDown = useTrackListKeyboard();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const onDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    handleDragEnd(event);
  };

  const onDragCancel = () => {
    setActiveId(null);
  };

  const addSelectedToQueue = useCallback(() => {
    const selectedTracks = tracks.filter((t) => isSelected(t.id));
    if (selectedTracks.length === 0) return;
    addToUserQueue(selectedTracks);
    clearSelected();
  }, [tracks, isSelected, addToUserQueue, clearSelected]);

  const table = (
    <Table
      variant="card"
      className="w-full"
      scrollContainerRef={scrollContainerRef}
    >
      <TableHeader
        className={cn(
          "hidden sm:table-header-group",
          "sticky top-0 z-10 [&_tr]:border-b-0",
          "[&_th]:bg-card [&_th]:font-normal [&_th]:text-muted-foreground",
        )}
      >
        <TableRow className="hover:bg-transparent">
          <TableHead className="hidden sm:table-cell w-12 min-w-12 max-w-12 text-center text-xs">
            {inSelectionMode ? (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={allSelected}
                  aria-label="Select all tracks"
                  onCheckedChange={setSelectAll}
                />
              </div>
            ) : (
              "#"
            )}
          </TableHead>
          <TableHead className="text-xs">Title</TableHead>
          <TableHead className="hidden text-xs md:table-cell">Album</TableHead>
          <TableHead className="hidden sm:table-cell w-20 text-right text-xs">
            Duration
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody className="h-full">
        <TrackListTableBody />
      </TableBody>
    </Table>
  );

  return (
    <div
      ref={listRef}
      className="flex min-h-0 flex-1 flex-col"
      onClick={() => setActivePane("tracklist")}
      onKeyDown={handleKeyDown}
    >
      <Frame className="flex min-h-0 w-full flex-1 flex-col overflow-hidden **:data-[slot=table-container]:min-h-0 **:data-[slot=table-container]:flex-1 **:data-[slot=table-container]:overflow-y-auto max-sm:**:data-[slot=table-container]:overflow-x-hidden">
        <div className="relative flex min-h-0 flex-1 flex-col">
          {tracks.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <p role="status" className="text-muted-foreground text-sm">
                {emptyMessage}
              </p>
            </div>
          ) : null}
          {reorderable ? (
            <DndContext
              id={dndContextId}
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragCancel={onDragCancel}
            >
              {table}
              <DragOverlay dropAnimation={null}>
                {activeTrack && activeIndex >= 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      <TrackRowPresentation
                        track={activeTrack}
                        index={activeIndex}
                        query={query}
                        isCurrent={currentTrack?.id === activeTrack.id}
                        isPlaying={
                          currentTrack?.id === activeTrack.id && isPlaying
                        }
                        showMenu
                        className="bg-card shadow-lg"
                      />
                    </tbody>
                  </table>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            table
          )}
        </div>
      </Frame>
      {selectable ? (
        <SelectionCommandBar
          selectedCount={selectedCount}
          playlists={playlists}
          removeLabel={removeBarLabel}
          removeDisabled={removePending}
          onAddToPlaylist={addSelectedToPlaylist}
          onAddToQueue={addSelectedToQueue}
          onRemove={removeSelected}
          onClear={clearSelected}
        />
      ) : null}
    </div>
  );
};

export const TrackList = ({
  tracks,
  view,
  query,
  emptyMessage = "No tracks yet.",
}: {
  tracks: Track[];
  view: TrackListView;
  query?: string;
  emptyMessage?: string;
}) => (
  <TrackListProvider view={view} initialTracks={tracks} query={query}>
    <TrackListInner emptyMessage={emptyMessage} />
  </TrackListProvider>
);
