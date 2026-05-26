"use client";

import { IconChevronDown } from "@tabler/icons-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerPanel,
  DrawerPopup,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FavoriteButton } from "@/app/_components/favorite-button";
import { QueueList } from "@/app/_playback/queue-list";
import { useCurrentTrack } from "@/contexts/deck-context";
import { ScrubBar, TransportButtons } from "./transport-bar";

const NowPlayingDrawerContent = () => {
  const currentTrack = useCurrentTrack();
  if (!currentTrack) return null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex shrink-0 flex-col items-center gap-4">
        <div className="aspect-square w-full max-w-xs overflow-hidden rounded-xl bg-muted shadow-2xl shadow-black/60">
          {currentTrack.artworkUrl ? (
            <Image
              src={currentTrack.artworkUrl}
              alt=""
              width={400}
              height={400}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <div className="flex w-full items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-center">
            <h2 className="truncate text-xl font-semibold text-foreground">
              {currentTrack.title}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {currentTrack.artist}
            </p>
          </div>
          <FavoriteButton
            trackId={currentTrack.id}
            isFavorite={currentTrack.isFavorite}
          />
        </div>
      </div>
      <QueueList className="min-h-0 flex-1" />
      <div className="flex shrink-0 flex-col items-center gap-4">
        <div className="w-full">
          <ScrubBar />
        </div>
        <TransportButtons />
      </div>
    </div>
  );
};

export const NowPlayingDrawer = ({ children }: { children: ReactNode }) => {
  const currentTrack = useCurrentTrack();

  return (
    <Drawer>
      <DrawerTrigger
        disabled={!currentTrack}
        render={
          <button
            type="button"
            aria-label="Open now playing"
            className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-100"
          />
        }
      >
        {children}
      </DrawerTrigger>
      <DrawerPopup
        variant="straight"
        showBar
        viewportClassName="pt-0"
        className="row-span-2 row-start-1 h-full rounded-none border-t-0"
      >
        <DrawerTitle className="sr-only">Now playing</DrawerTitle>

        <DrawerPanel
          scrollable={false}
          className="flex flex-1 flex-col pt-[calc(env(safe-area-inset-top,0px)+--spacing(6))]"
        >
          <NowPlayingDrawerContent />
        </DrawerPanel>
      </DrawerPopup>
    </Drawer>
  );
};
