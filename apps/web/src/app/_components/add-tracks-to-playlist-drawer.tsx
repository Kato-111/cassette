"use client";

import { IconPlus, IconSearch } from "@tabler/icons-react";
import type { Track } from "@/generated/prisma";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { attachTracksAction } from "@/app/_actions/playlists";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/format";
import { filterTracksByQuery } from "@/lib/queries";
import { cn } from "@/lib/utils";

type AddTracksToPlaylistDrawerProps = {
  playlistId: string;
  libraryTracks: Track[];
  existingTrackIds: Set<string>;
};

export const AddTracksToPlaylistDrawer = ({
  playlistId,
  libraryTracks,
  existingTrackIds,
}: AddTracksToPlaylistDrawerProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(
    () => filterTracksByQuery(libraryTracks, query),
    [libraryTracks, query],
  );

  const reset = () => {
    setSelected(new Set());
    setQuery("");
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const toggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;

  const handleSubmit = () => {
    if (selectedCount === 0) return;
    const ids = Array.from(selected);
    startTransition(async () => {
      const result = await attachTracksAction(playlistId, ids);
      if (result.ok) {
        reset();
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <Drawer position="bottom" open={open} onOpenChange={handleOpenChange}>
      <DrawerTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Add tracks to playlist"
          >
            <IconPlus />
          </Button>
        }
      />
      <DrawerPopup className="mx-auto w-full max-w-2xl" showBar>
        <DrawerPanel className="flex flex-col gap-4 pt-6" scrollable={false}>
          <div className="flex flex-col gap-1">
            <DrawerTitle>Add to playlist</DrawerTitle>
            <DrawerDescription>
              Select tracks from your library to add.
            </DrawerDescription>
          </div>

          <div className="relative">
            <IconSearch
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Search your library"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="-mx-2 max-h-[50vh] overflow-y-auto sm:max-h-[45vh]">
            {libraryTracks.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Your library is empty.
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No tracks match &ldquo;{query}&rdquo;.
              </p>
            ) : (
              <ul className="flex flex-col">
                {filtered.map((track) => {
                  const already = existingTrackIds.has(track.id);
                  const isChecked = already || selected.has(track.id);
                  return (
                    <li key={track.id}>
                      <button
                        type="button"
                        disabled={already}
                        onClick={() => toggle(track.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-left outline-none",
                          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                          already
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:bg-accent/40",
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          disabled={already}
                          tabIndex={-1}
                          aria-label={`Select ${track.title}`}
                          onClick={(e) => {
                            // e.stopPropagation();
                            // e.preventDefault();
                          }}
                          onCheckedChange={() => {
                            if (!already) toggle(track.id);
                          }}
                        />
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
                          <div className="truncate text-sm font-medium text-foreground">
                            {track.title}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {track.artist ?? "Unknown artist"}
                          </div>
                        </div>
                        {already ? (
                          <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                            Added
                          </span>
                        ) : (
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {formatDuration(track.durationSec)}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DrawerPanel>
        <DrawerFooter variant="bare">
          <DrawerClose
            render={
              <Button variant="ghost" disabled={pending}>
                Cancel
              </Button>
            }
          />
          <Button
            onClick={handleSubmit}
            loading={pending}
            disabled={selectedCount === 0}
          >
            {selectedCount === 0
              ? "Add tracks"
              : selectedCount === 1
                ? "Add 1 track"
                : `Add ${selectedCount} tracks`}
          </Button>
        </DrawerFooter>
      </DrawerPopup>
    </Drawer>
  );
};
