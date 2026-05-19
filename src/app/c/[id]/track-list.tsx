"use client";

import {
  IconDots,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
} from "@tabler/icons-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import type { Track } from "@prisma/client";
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
import { attachTrackAction } from "@/app/_actions/collections";
import { useDeck } from "@/app/_playback/deck-context";
import { useLibrary } from "@/app/_hooks/use-library";
import { formatDuration, highlightMatch } from "@/lib/format";
import { cn } from "@/lib/utils";

const TrackRow = ({
  track,
  index,
  query,
}: {
  track: Track;
  index: number;
  query?: string;
}) => {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlayPause,
    setActivePane,
    handlePaneKey,
  } = useDeck();
  const { collections } = useLibrary();

  const isCurrent = currentTrack?.id === track.id;

  const trigger = () => {
    setActivePane("tracklist");
    if (isCurrent) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  return (
    <TableRow
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
      className="group/tr cursor-pointer select-none outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
    >
      <TableCell className="w-12 text-center tabular-nums">
        {isCurrent && isPlaying ? (
          <div className="mx-auto flex h-3 items-end justify-center gap-[2px]">
            <div className="deck-eq-bar deck-eq-bar-1 h-3 w-1 bg-rose" />
            <div className="deck-eq-bar deck-eq-bar-2 h-3 w-1 bg-rose" />
            <div className="deck-eq-bar deck-eq-bar-3 h-3 w-1 bg-rose" />
          </div>
        ) : (
          <span
            className={cn(
              "group-hover/tr:hidden",
              isCurrent ? "text-rose" : "text-muted-foreground",
            )}
          >
            {index + 1}
          </span>
        )}
        {!(isCurrent && isPlaying) && (
          <IconPlayerPlay className="mx-auto hidden size-3.5 text-foreground group-hover/tr:block" />
        )}
      </TableCell>
      <TableCell>
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
        {track.album ? highlightMatch(track.album, query) : "—"}
      </TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">
        {formatDuration(track.durationSec)}
      </TableCell>
      <TableCell className="w-10">
        <div className="opacity-0 transition-opacity group-hover/tr:opacity-100">
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
                  <IconPlus /> Add to collection
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48">
                  {collections.map((c) => (
                    <DropdownMenuItem
                      key={c.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void attachTrackAction(c.id, track.id);
                      }}
                    >
                      {c.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
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
    <Frame className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
      <Table variant="card" className="w-full">
        <TableHeader
          className={cn(
            "sticky top-0 z-10 [&_tr]:border-b-0",
            "[&_th]:bg-card [&_th]:font-normal [&_th]:text-muted-foreground",
          )}
        >
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-center text-xs">#</TableHead>
            <TableHead className="text-xs">Title</TableHead>
            <TableHead className="hidden text-xs md:table-cell">
              Album
            </TableHead>
            <TableHead className="w-20 text-right text-xs">Duration</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody className="h-full">
          {SKELETON_ROW_KEYS.map((key) => (
            <TableRow key={key} className="hover:bg-transparent">
              <TableCell className="w-12">
                <Skeleton className="mx-auto size-4 rounded-sm" />
              </TableCell>
              <TableCell>
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
              <TableCell className="text-right">
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
  tracks,
  query,
}: {
  tracks: Track[];
  query?: string;
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const { registerPaneRef, setActivePane, setQueue } = useDeck();

  useEffect(() => {
    registerPaneRef("tracklist", listRef);
  }, [registerPaneRef]);

  useEffect(() => {
    setQueue(tracks);
  }, [tracks, setQueue]);

  return (
    <div
      ref={listRef}
      className="flex h-full min-h-0 flex-col"
      onClick={() => setActivePane("tracklist")}
    >
      <Frame className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <Table variant="card" className="w-full">
          <TableHeader
            className={cn(
              "sticky top-0 z-10 [&_tr]:border-b-0",
              "[&_th]:bg-card [&_th]:font-normal [&_th]:text-muted-foreground",
            )}
          >
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-center text-xs">#</TableHead>
              <TableHead className="text-xs">Title</TableHead>
              <TableHead className="hidden text-xs md:table-cell">
                Album
              </TableHead>
              <TableHead className="w-20 text-right text-xs">
                Duration
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody className="h-full">
            {tracks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  No tracks yet.
                </TableCell>
              </TableRow>
            ) : (
              tracks.map((track, i) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={i}
                  query={query}
                />
              ))
            )}
          </TableBody>
        </Table>
      </Frame>
    </div>
  );
};
