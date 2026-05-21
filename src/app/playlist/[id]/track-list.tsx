"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconDots,
  IconGripVertical,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
} from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { Track } from "@prisma/client";
import { reorderPlaylistTracksAction } from "@/app/_actions/playlists";
import { reorderLibraryTracksAction } from "@/app/_actions/tracks";
import { Button } from "@/components/ui/button";
import { Frame } from "@/components/ui/frame";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { attachTrackAction } from "@/app/_actions/playlists";
import { FavoriteButton } from "@/app/_components/favorite-button";
import { useDeck } from "@/app/_playback/deck-context";
import { useLibrary } from "@/app/_hooks/use-library";
import { formatDuration, highlightMatch } from "@/lib/format";
import { cn } from "@/lib/utils";

export type TrackListReorder =
  | { type: "library" }
  | { type: "playlist"; playlistId: string };

const TrackRow = ({
  track,
  index,
  query,
  sortable,
  setNodeRef,
  style,
  isDragging,
  dragHandleProps,
}: {
  track: Track;
  index: number;
  query?: string;
  sortable: boolean;
  setNodeRef?: (node: HTMLTableRowElement | null) => void;
  style?: React.CSSProperties;
  isDragging?: boolean;
  dragHandleProps?: {
    attributes: DraggableAttributes;
    listeners: ReturnType<typeof useSortable>["listeners"];
  };
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    setActivePane,
    handlePaneKey,
  } = useDeck();
  const { playlists } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;

  const trigger = () => {
    setActivePane("tracklist");
    if (isCurrent) {
      if (!isPlaying) togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      tabIndex={0}
      data-state={isCurrent ? "selected" : undefined}
      onClick={trigger}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger();
        } else {
          handlePaneKey(e, "tracklist");
        }
      }}
      className={cn(
        "group/tr cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        isDragging && "relative z-10 opacity-60",
      )}
    >
      <TableCell className="w-12 min-w-12 max-w-12 max-sm:w-0 max-sm:min-w-0 max-sm:max-w-0 max-sm:p-0 max-sm:overflow-hidden text-center tabular-nums">
        <div className="relative mx-auto size-7 shrink-0 max-sm:hidden">
          {sortable && dragHandleProps ? (
            <button
              type="button"
              className={cn(
                "absolute inset-0 hidden items-center justify-center rounded-sm text-muted-foreground",
                "cursor-grab active:cursor-grabbing hover:text-foreground",
                "group-hover/tr:flex focus-visible:flex",
                isDragging && "flex",
              )}
              aria-label={`Reorder ${track.title}`}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              {...dragHandleProps.attributes}
              {...(dragHandleProps.listeners ?? {})}
            >
              <IconGripVertical className="size-3.5" />
            </button>
          ) : null}
          {isCurrent && isPlaying ? (
            <div
              className={cn(
                "absolute inset-0 flex items-end justify-center gap-[2px] pb-2",
                sortable && "group-hover/tr:hidden",
              )}
            >
              <div className="deck-eq-bar deck-eq-bar-1 h-3 w-1 bg-rose" />
              <div className="deck-eq-bar deck-eq-bar-2 h-3 w-1 bg-rose" />
              <div className="deck-eq-bar deck-eq-bar-3 h-3 w-1 bg-rose" />
            </div>
          ) : (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center text-sm",
                sortable && "group-hover/tr:hidden",
                isCurrent ? "text-rose" : "text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
          )}
          {!(isCurrent && isPlaying) && (
            <IconPlayerPlay
              className={cn(
                "absolute inset-0 m-auto hidden size-3.5 text-foreground",
                sortable ? "group-hover/tr:hidden" : "group-hover/tr:block",
              )}
            />
          )}
        </div>
      </TableCell>
      <TableCell className="w-full max-w-0">
        <div className="flex items-center gap-3">
          <div className="relative size-9 shrink-0 overflow-hidden rounded-sm bg-muted">
            {track.artworkUrl ? (
              <Image
                src={track.artworkUrl}
                alt=""
                width={36}
                height={36}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "truncate text-sm font-medium",
                isCurrent ? "text-rose" : "text-foreground",
              )}
            >
              {highlightMatch(track.title, query)}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {highlightMatch(track.artist, query)}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        <span className="block truncate">
          {track.album ? highlightMatch(track.album, query) : "—"}
        </span>
      </TableCell>
      <TableCell className="hidden sm:table-cell text-right tabular-nums text-muted-foreground">
        {formatDuration(track.durationSec)}
      </TableCell>
      <TableCell className="w-10">
        <div className="opacity-100 transition-opacity md:opacity-0 md:group-hover/tr:opacity-100">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Track options"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconDots />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  if (isCurrent) togglePlayPause();
                  else playTrack(track);
                }}
              >
                {isCurrent && isPlaying ? (
                  <>
                    <IconPlayerPause /> Pause
                  </>
                ) : (
                  <>
                    <IconPlayerPlay /> Play
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <IconPlus /> Add to playlist
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {playlists.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void attachTrackAction(p.id, track.id);
                      }}
                    >
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <FavoriteButton
                trackId={track.id}
                isFavorite={track.isFavorite}
                variant="menu-item"
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
};

const SortableTrackRow = ({
  track,
  index,
  query,
}: {
  track: Track;
  index: number;
  query?: string;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TrackRow
      track={track}
      index={index}
      query={query}
      sortable
      setNodeRef={setNodeRef}
      style={style}
      isDragging={isDragging}
      dragHandleProps={{ attributes, listeners }}
    />
  );
};

const SKELETON_ROW_KEYS = [
  "sk-r0",
  "sk-r1",
  "sk-r2",
  "sk-r3",
  "sk-r4",
  "sk-r5",
  "sk-r6",
  "sk-r7",
  "sk-r8",
  "sk-r9",
] as const;

export const TrackListSkeleton = () => (
  <div className="flex h-full min-h-0 flex-col" aria-hidden>
    <Frame className="flex min-h-0 w-full flex-1 flex-col overflow-hidden max-sm:**:data-[slot=table-container]:overflow-x-hidden">
      <Table variant="card" className="w-full">
        <TableHeader
          className={cn(
            "hidden sm:table-header-group",
            "sticky top-0 z-10 [&_tr]:border-b-0",
            "[&_th]:bg-card [&_th]:font-normal [&_th]:text-muted-foreground",
          )}
        >
          <TableRow className="hover:bg-transparent">
            <TableHead className="hidden sm:table-cell w-12 min-w-12 max-w-12 text-center text-xs">
              #
            </TableHead>
            <TableHead className="text-xs">Title</TableHead>
            <TableHead className="hidden text-xs md:table-cell">
              Album
            </TableHead>
            <TableHead className="hidden sm:table-cell w-20 text-right text-xs">
              Duration
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody className="h-full">
          {SKELETON_ROW_KEYS.map((key) => (
            <TableRow key={key} className="hover:bg-transparent">
              <TableCell className="w-12 min-w-12 max-w-12 max-sm:w-0 max-sm:min-w-0 max-sm:max-w-0 max-sm:p-0 max-sm:overflow-hidden">
                <Skeleton className="mx-auto size-7 rounded-sm max-sm:hidden" />
              </TableCell>
              <TableCell className="w-full max-w-0">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-sm" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-[min(100%,14rem)] rounded-sm" />
                    <Skeleton className="h-3 w-[min(85%,10rem)] rounded-sm" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground">
                <Skeleton className="h-4 w-24 rounded-sm" />
              </TableCell>
              <TableCell className="hidden sm:table-cell text-right">
                <Skeleton className="ml-auto h-4 w-10 rounded-sm" />
              </TableCell>
              <TableCell className="w-10">
                <Skeleton className="size-7 rounded-sm opacity-40" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Frame>
  </div>
);

export const TrackList = ({
  tracks: initialTracks,
  query,
  reorder,
  emptyMessage = "No tracks yet.",
}: {
  tracks: Track[];
  query?: string;
  reorder?: TrackListReorder;
  emptyMessage?: string;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const dndContextId = useId();
  const { registerPaneRef, setActivePane, setQueue } = useDeck();
  const [tracks, setTracks] = useState(initialTracks);
  const canReorder = Boolean(reorder && !query);

  useEffect(() => {
    registerPaneRef("tracklist", listRef);
  }, [registerPaneRef]);

  useEffect(() => {
    setQueue(tracks);
  }, [tracks, setQueue]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !reorder) return;

    const oldIndex = tracks.findIndex((t) => t.id === active.id);
    const newIndex = tracks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(tracks, oldIndex, newIndex);
    setTracks(next);

    const ids = next.map((t) => t.id);
    if (reorder.type === "library") {
      void reorderLibraryTracksAction(ids);
    } else {
      void reorderPlaylistTracksAction(reorder.playlistId, ids);
    }
  };

  const trackRows = tracks.map((track, i) =>
    canReorder ? (
      <SortableTrackRow key={track.id} track={track} index={i} query={query} />
    ) : (
      <TrackRow
        key={track.id}
        track={track}
        index={i}
        query={query}
        sortable={false}
      />
    ),
  );

  const tableBody =
    tracks.length === 0 ? (
      <TableRow>
        <TableCell
          colSpan={5}
          className="py-12 text-center text-muted-foreground"
        >
          {emptyMessage}
        </TableCell>
      </TableRow>
    ) : canReorder ? (
      <SortableContext
        items={tracks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {trackRows}
      </SortableContext>
    ) : (
      trackRows
    );

  const table = (
    <Table variant="card" className="w-full">
      <TableHeader
        className={cn(
          "hidden sm:table-header-group",
          "sticky top-0 z-10 [&_tr]:border-b-0",
          "[&_th]:bg-card [&_th]:font-normal [&_th]:text-muted-foreground",
        )}
      >
        <TableRow className="hover:bg-transparent">
          <TableHead className="hidden sm:table-cell w-12 min-w-12 max-w-12 text-center text-xs">
            #
          </TableHead>
          <TableHead className="text-xs">Title</TableHead>
          <TableHead className="hidden text-xs md:table-cell">Album</TableHead>
          <TableHead className="hidden sm:table-cell w-20 text-right text-xs">
            Duration
          </TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody className="h-full">{tableBody}</TableBody>
    </Table>
  );

  return (
    <div
      ref={listRef}
      className="flex h-full min-h-0 flex-col"
      onClick={() => setActivePane("tracklist")}
    >
      <Frame className="flex min-h-0 w-full flex-1 flex-col overflow-hidden  max-sm:**:data-[slot=table-container]:overflow-x-hidden ">
        {canReorder ? (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            {table}
          </DndContext>
        ) : (
          table
        )}
      </Frame>
    </div>
  );
};
