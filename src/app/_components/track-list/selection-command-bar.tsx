"use client";

import { IconHeart, IconList, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/menu";
import { Separator } from "@/components/ui/separator";
import { isTypingTarget } from "@/lib/keyboard";
import { cn } from "@/lib/utils";

type Playlist = { id: string; name: string };

type SelectionCommandBarProps = {
  selectedCount: number;
  playlists: Playlist[];
  removeLabel: string;
  removeDisabled: boolean;
  onAddToPlaylist: (playlistId: string) => void;
  onAddToQueue: () => void;
  onFavorite: () => void;
  onRemove: () => void;
  onClear: () => void;
};

const EASE_OUT_CUBIC = [0.215, 0.61, 0.355, 1] as const;

const COMMAND_BAR_SURFACE =
  "border border-white/15 bg-[color-mix(in_srgb,var(--card)_82%,var(--color-white)_10%)] shadow-[0_16px_48px_rgb(0_0_0/0.72),0_4px_14px_rgb(0_0_0/0.45),inset_0_1px_0_rgb(255_255_255/0.1)] ring-1 ring-white/12 backdrop-blur-md";

const COMMAND_BAR_BUTTON = "rounded-full before:rounded-full";

export function SelectionCommandBar({
  selectedCount,
  playlists,
  removeLabel,
  removeDisabled,
  onAddToPlaylist,
  onAddToQueue,
  onFavorite,
  onRemove,
  onClear,
}: SelectionCommandBarProps) {
  const open = selectedCount > 0;
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || isTypingTarget(e.target)) return;
      e.preventDefault();
      onClear();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClear]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          role="toolbar"
          aria-label="Track selection actions"
          className={cn(
            "pointer-events-auto fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full p-1 text-card-foreground sm:bottom-28",
            COMMAND_BAR_SURFACE,
          )}
          initial={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }
          }
          animate={
            reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.96 }
          }
          transition={{
            duration: reduceMotion ? 0.12 : 0.22,
            ease: EASE_OUT_CUBIC,
          }}
          style={{ willChange: "transform, opacity" }}
        >
          <div className="flex items-center rounded-full border border-dashed border-white/25 bg-white/4 ps-2.5">
            <span className="text-sm tabular-nums text-muted-foreground">
              {selectedCount} selected
            </span>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Clear selection"
              onClick={onClear}
              className={COMMAND_BAR_BUTTON}
            >
              <IconX />
            </Button>
          </div>
          <Separator
            orientation="vertical"
            className="mx-0.5 h-5 shrink-0 bg-white/15"
            aria-hidden
          />
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={playlists.length === 0}
                    className={COMMAND_BAR_BUTTON}
                  >
                    <IconPlus /> Add to playlist
                  </Button>
                }
              />
              <DropdownMenuContent align="center" side="top" className="w-48">
                {playlists.map((p) => (
                  <DropdownMenuItem
                    key={p.id}
                    onClick={() => onAddToPlaylist(p.id)}
                  >
                    {p.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddToQueue}
              className={COMMAND_BAR_BUTTON}
            >
              <IconList /> Add to queue
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onFavorite}
              className={cn(COMMAND_BAR_BUTTON, "text-rose")}
            >
              <IconHeart /> Favorite
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={removeDisabled}
              onClick={onRemove}
              className={cn(COMMAND_BAR_BUTTON, "text-destructive-foreground")}
            >
              <IconTrash /> {removeLabel}
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
