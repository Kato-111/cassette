"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback } from "react";
import {
  IconDots,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Image from "next/image";
import type { Track } from "@prisma/client";
import { attachTrackAction } from "@/app/_actions/playlists";
import { FavoriteButton } from "@/app/_components/favorite-button";
import {
  removeAlbumLabel,
  removeTrackLabel,
} from "@/app/_components/track-list/labels";
import { useDeck } from "@/contexts/deck-context";
import { useLibrary } from "@/contexts/library-context";
import { useTrackList } from "@/contexts/track-list-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDuration, highlightMatch } from "@/lib/format";
import { cn } from "@/lib/utils";

type TrackRowProps = {
  track: Track;
  index: number;
  query?: string;
};

export const TrackRow = ({ track, index, query }: TrackRowProps) => {
  const {
    reorderable,
    dragEnabled,
    selectable,
    removeScope,
    removePending,
    inSelectionMode,
    isSelected,
    toggleSelected,
    removeTrack,
    removeAlbum,
    focusedIndex,
    setFocusedId,
    registerRowRef,
  } = useTrackList();
  const { currentTrack, isPlaying, playTrack, togglePlayPause, setActivePane } =
    useDeck();
  const { playlists } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;
  const selected = isSelected(track.id);
  const isFocused = focusedIndex === index;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id, disabled: !reorderable || !dragEnabled });

  const style: React.CSSProperties = reorderable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        willChange: isDragging ? "transform" : undefined,
      }
    : {};

  const handleRowClick = () => {
    setActivePane("tracklist");
    if (selectable && inSelectionMode) {
      toggleSelected(track.id);
      return;
    }
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const dragAttrs = dragEnabled ? attributes : undefined;
  const dragListeners = dragEnabled ? listeners : undefined;

  const setRefs = useCallback(
    (el: HTMLTableRowElement | null) => {
      setNodeRef(el);
      registerRowRef(track.id, el);
    },
    [setNodeRef, registerRowRef, track.id],
  );

  return (
    <TableRow
      ref={setRefs}
      style={style}
      {...dragAttrs}
      {...(dragListeners ?? {})}
      tabIndex={isFocused ? 0 : -1}
      data-state={isCurrent || selected ? "selected" : undefined}
      onClick={handleRowClick}
      onFocus={() => setFocusedId(track.id)}
      className={cn(
        "group/tr select-none",
        isFocused
          ? "outline-1 -outline-offset-1 outline-ring z-10"
          : "outline-none",
        dragEnabled ? " active:cursor-grabbing" : "cursor-pointer",
        isDragging && "relative z-10 opacity-60",
      )}
    >
      <TableCell className="w-12 min-w-12 max-w-12 max-sm:w-0 max-sm:min-w-0 max-sm:max-w-0 max-sm:p-0 max-sm:overflow-hidden text-center tabular-nums">
        <div className="relative mx-auto size-7 shrink-0 max-sm:hidden">
          {isCurrent && isPlaying ? (
            <div
              className={cn(
                "absolute inset-0 flex items-end justify-center gap-[2px] pb-2",
                selectable && "group-hover/tr:hidden",
                (selected || inSelectionMode) && "hidden",
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
                selectable && "group-hover/tr:hidden",
                (selected || inSelectionMode) && "hidden",
                isCurrent ? "text-rose" : "text-muted-foreground",
              )}
            >
              {index + 1}
            </span>
          )}
          {selectable ? (
            <span
              className={cn(
                "absolute inset-0 m-auto flex items-center justify-center",
                "hidden group-hover/tr:flex focus-visible-within:flex cursor-default",
                (selected || inSelectionMode) && "flex",
              )}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={selected}
                aria-label={`Select ${track.title}`}
                onCheckedChange={() => toggleSelected(track.id)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              />
            </span>
          ) : (
            !(isCurrent && isPlaying) && (
              <IconPlayerPlay className="absolute inset-0 m-auto hidden size-3.5 text-foreground group-hover/tr:block" />
            )
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
                  onPointerDown={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <IconDots />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-56">
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
              {removeScope ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={removePending}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTrack(track.id);
                    }}
                  >
                    <IconTrash />
                    {removeTrackLabel(removeScope)}
                  </DropdownMenuItem>
                  {track.album ? (
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={removePending}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAlbum(track.album!);
                      }}
                    >
                      <IconTrash />
                      {removeAlbumLabel(removeScope, track.album)}
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}
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
