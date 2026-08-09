"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconDots,
  IconList,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import Image from "next/image";
import type { Track } from "@/generated/prisma";
import { memo, useState, type CSSProperties, type ReactNode } from "react";
import { attachTrackAction } from "@/app/_actions/playlists";
import { FavoriteButton } from "@/app/_components/favorite-button";
import { removeTrackLabel } from "@/app/_components/track-list/labels";
import {
  useAddToUserQueue,
  useSetActivePane,
  useTogglePlayPause,
} from "@/contexts/deck-context";
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

const COLUMN_COUNT = 5;

const TrackEqBars = () => (
  <div className="absolute inset-0 flex items-end justify-center gap-[2px] pb-2">
    <div className="deck-eq-bar deck-eq-bar-1 h-3 w-1 bg-rose" />
    <div className="deck-eq-bar deck-eq-bar-2 h-3 w-1 bg-rose" />
    <div className="deck-eq-bar deck-eq-bar-3 h-3 w-1 bg-rose" />
  </div>
);

type TrackRowIndexCellProps = {
  index: number;
  isCurrent: boolean;
  isPlaying: boolean;
  selectable?: boolean;
  selected?: boolean;
  inSelectionMode?: boolean;
  onToggleSelected?: () => void;
  trackTitle?: string;
};

const TrackRowIndexCell = ({
  index,
  isCurrent,
  isPlaying,
  selectable = false,
  selected = false,
  inSelectionMode = false,
  onToggleSelected,
  trackTitle,
}: TrackRowIndexCellProps) => (
  <TableCell className="w-12 min-w-12 max-w-12 max-sm:w-0 max-sm:min-w-0 max-sm:max-w-0 max-sm:p-0 max-sm:overflow-hidden text-center tabular-nums">
    <div className="relative mx-auto size-7 shrink-0 max-sm:hidden">
      {isCurrent && isPlaying ? (
        <div
          className={cn(
            "absolute inset-0",
            selectable && "group-hover/tr:hidden",
            (selected || inSelectionMode) && "hidden",
          )}
        >
          <TrackEqBars />
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
          onTouchStart={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={selected}
            aria-label={trackTitle ? `Select ${trackTitle}` : "Select track"}
            onCheckedChange={onToggleSelected}
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
);

type TrackRowCellsProps = {
  track: Track;
  query?: string;
  isCurrent: boolean;
  indexCell: ReactNode;
  menuCell: ReactNode;
};

const TrackRowCells = ({
  track,
  query,
  isCurrent,
  indexCell,
  menuCell,
}: TrackRowCellsProps) => (
  <>
    {indexCell}
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
    {menuCell}
  </>
);

type TrackRowPresentationProps = {
  track: Track;
  index: number;
  query?: string;
  isCurrent?: boolean;
  isPlaying?: boolean;
  className?: string;
  showMenu?: boolean;
};

export const TrackRowPresentation = ({
  track,
  index,
  query,
  isCurrent = false,
  isPlaying = false,
  className,
  showMenu = false,
}: TrackRowPresentationProps) => (
  <TableRow
    className={cn(
      "group/tr select-none cursor-default shadow-md",
      isCurrent && "data-[state=selected]",
      className,
    )}
    data-state={isCurrent ? "selected" : undefined}
  >
    <TrackRowCells
      track={track}
      query={query}
      isCurrent={isCurrent}
      indexCell={
        <TrackRowIndexCell
          index={index}
          isCurrent={isCurrent}
          isPlaying={isPlaying}
        />
      }
      menuCell={
        <TableCell className="w-10">
          {showMenu ? (
            <div className="opacity-100">
              <Button variant="ghost" size="icon-xs" aria-hidden tabIndex={-1}>
                <IconDots />
              </Button>
            </div>
          ) : null}
        </TableCell>
      }
    />
  </TableRow>
);

type TrackRowMenuProps = {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onTogglePlayPause: () => void;
};

const TrackRowMenu = ({
  track,
  isCurrent,
  isPlaying,
  onPlay,
  onTogglePlayPause,
}: TrackRowMenuProps) => {
  const [open, setOpen] = useState(false);
  const { removeScope, removePending, removeTrack } = useTrackList();
  const { playlists } = useLibrary();
  const addToUserQueue = useAddToUserQueue();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Track options"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <IconDots />
          </Button>
        }
      />
      {open ? (
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrent) onTogglePlayPause();
              else onPlay();
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
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              addToUserQueue([track]);
            }}
          >
            <IconList /> Add to queue
          </DropdownMenuItem>
          {removeScope ? (
            <>
              <DropdownMenuSeparator />
              {removeScope === "playlist" ? (
                <DropdownMenuItem
                  variant="destructive"
                  disabled={removePending}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTrack(track.id, "playlist");
                  }}
                >
                  <IconTrash />
                  {removeTrackLabel("playlist")}
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                variant="destructive"
                disabled={removePending}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTrack(track.id, "library");
                }}
              >
                <IconTrash />
                {removeTrackLabel("library")}
              </DropdownMenuItem>
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
      ) : null}
    </DropdownMenu>
  );
};

export type TrackRowProps = {
  track: Track;
  index: number;
  query?: string;
  isCurrent: boolean;
  isPlaying: boolean;
  isSelected: boolean;
  onPlay: (index: number) => void;
};

const TrackRowInner = ({
  track,
  index,
  query,
  isCurrent,
  isPlaying,
  isSelected: selected,
  onPlay,
}: TrackRowProps) => {
  const {
    reorderable,
    dragEnabled,
    selectable,
    inSelectionMode,
    toggleSelected,
  } = useTrackList();
  const togglePlayPause = useTogglePlayPause();
  const setActivePane = useSetActivePane();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id, disabled: !reorderable || !dragEnabled });

  const style: CSSProperties = reorderable
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
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
      onPlay(index);
    }
  };

  const dragAttrs = dragEnabled ? attributes : undefined;
  const dragListeners = dragEnabled ? listeners : undefined;

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...dragAttrs}
      {...(dragListeners ?? {})}
      data-state={isCurrent || selected ? "selected" : undefined}
      onClick={handleRowClick}
      className={cn(
        "group/tr select-none",
        !dragEnabled && "cursor-pointer",
        isDragging && "opacity-0",
      )}
    >
      <TrackRowCells
        track={track}
        query={query}
        isCurrent={isCurrent}
        indexCell={
          <TrackRowIndexCell
            index={index}
            isCurrent={isCurrent}
            isPlaying={isPlaying}
            selectable={selectable}
            selected={selected}
            inSelectionMode={inSelectionMode}
            onToggleSelected={() => toggleSelected(track.id)}
            trackTitle={track.title}
          />
        }
        menuCell={
          <TableCell className="w-10">
            <div className="opacity-100 transition-opacity md:opacity-0 md:group-hover/tr:opacity-100">
              <TrackRowMenu
                track={track}
                isCurrent={isCurrent}
                isPlaying={isPlaying}
                onPlay={() => onPlay(index)}
                onTogglePlayPause={togglePlayPause}
              />
            </div>
          </TableCell>
        }
      />
    </TableRow>
  );
};

export const TrackRow = memo(TrackRowInner);

export { COLUMN_COUNT as TRACK_ROW_COLUMN_COUNT };
