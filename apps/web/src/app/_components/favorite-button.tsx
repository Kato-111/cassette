"use client";

import { IconHeart, IconHeartFilled } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toggleFavoriteAction } from "@/app/_actions/tracks";
import { usePatchTrack } from "@/contexts/deck-context";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/menu";
import { cn } from "@/lib/utils";

export const useFavoriteToggle = (
  trackId: string,
  initialFavorite: boolean,
) => {
  const router = useRouter();
  const patchTrack = usePatchTrack();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite, trackId]);

  const toggle = () => {
    const prev = isFavorite;
    const next = !prev;
    setIsFavorite(next);
    startTransition(() => {
      void toggleFavoriteAction(trackId).then((result) => {
        if (!result.ok) {
          setIsFavorite(prev);
          return;
        }
        setIsFavorite(result.isFavorite);
        patchTrack(trackId, { isFavorite: result.isFavorite });
        router.refresh();
      });
    });
  };

  return { isFavorite, toggle, pending };
};

type FavoriteButtonProps = {
  trackId: string;
  isFavorite: boolean;
  variant?: "icon" | "menu-item";
  className?: string;
  disabled?: boolean;
};

export const FavoriteButton = ({
  trackId,
  isFavorite: initialFavorite,
  variant = "icon",
  className,
  disabled,
}: FavoriteButtonProps) => {
  const { isFavorite, toggle, pending } = useFavoriteToggle(
    trackId,
    initialFavorite,
  );

  const label = isFavorite ? "Remove from favorites" : "Add to favorites";
  const HeartIcon = isFavorite ? IconHeartFilled : IconHeart;

  if (variant === "menu-item") {
    return (
      <DropdownMenuItem
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        disabled={pending || disabled}
      >
        <HeartIcon className={cn(isFavorite && "text-rose")} />
        {label}
      </DropdownMenuItem>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      disabled={disabled || pending}
      onClick={toggle}
      aria-label={label}
      aria-pressed={isFavorite}
      className={cn(
        "shrink-0 text-muted-foreground hover:bg-foreground/10 hover:text-foreground",
        isFavorite && "text-rose hover:text-rose",
        className,
      )}
    >
      <HeartIcon />
    </Button>
  );
};
