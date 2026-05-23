"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IconGripVertical, IconX } from "@tabler/icons-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { QueueItem } from "@/contexts/deck-context";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";

const SWIPE_REMOVE_THRESHOLD = 80;

type QueueListRowProps = {
  item: QueueItem;
  onRemove: (itemId: string) => void;
  overlay?: boolean;
};

export const QueueListRow = ({
  item,
  onRemove,
  overlay = false,
}: QueueListRowProps) => {
  const reduceMotion = useReducedMotion();
  const { track } = item;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: overlay });

  const [swipeX, setSwipeX] = useState(0);
  const startXRef = useRef<number | null>(null);
  const swipingRef = useRef(false);

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        willChange: isDragging ? "transform" : undefined,
      };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (overlay || isDragging) return;
    startXRef.current = e.touches[0]?.clientX ?? null;
    swipingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingRef.current || startXRef.current === null || overlay) return;
    const currentX = e.touches[0]?.clientX ?? startXRef.current;
    const delta = Math.min(0, currentX - startXRef.current);
    setSwipeX(delta);
  };

  const handleTouchEnd = () => {
    if (!swipingRef.current) return;
    swipingRef.current = false;
    startXRef.current = null;
    if (swipeX <= -SWIPE_REMOVE_THRESHOLD) {
      onRemove(item.id);
      setSwipeX(0);
      return;
    }
    setSwipeX(0);
  };

  const rowContent = (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-2 py-2",
        !overlay && "hover:bg-accent/40",
        isDragging && "opacity-40",
        overlay && "bg-card shadow-lg",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${track.title}`}
        className={cn(
          "flex shrink-0 touch-none items-center justify-center text-muted-foreground/60",
          "cursor-grab active:cursor-grabbing",
        )}
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
      >
        <IconGripVertical className="size-4" />
      </button>
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
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {formatDuration(track.durationSec)}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={`Remove ${track.title} from queue`}
        className="shrink-0 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
      >
        <IconX className="size-3.5" />
      </Button>
    </div>
  );

  if (overlay) {
    return rowContent;
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="relative list-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {swipeX < -20 ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 inset-e-0 flex w-16 items-center justify-center rounded-e-md bg-destructive/15 text-destructive-foreground"
        >
          <IconX className="size-4" />
        </div>
      ) : null}
      <motion.div
        animate={{ x: reduceMotion ? 0 : swipeX }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 40 }
        }
      >
        {rowContent}
      </motion.div>
    </li>
  );
};
