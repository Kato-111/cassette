"use client";

import { IconArrowsShuffle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useIsShuffled, useToggleShuffle } from "@/contexts/deck-context";
import { cn } from "@/lib/utils";

type ShuffleButtonProps = {
  size?: "icon" | "icon-sm";
  className?: string;
};

/** Toggles shuffle mode. Reorders the active queue when something is playing. */
export const ShuffleButton = ({
  size = "icon-sm",
  className,
}: ShuffleButtonProps) => {
  const isShuffled = useIsShuffled();
  const toggleShuffle = useToggleShuffle();

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={toggleShuffle}
      aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
      aria-pressed={isShuffled}
      className={cn(isShuffled && "text-rose", className)}
    >
      <IconArrowsShuffle />
    </Button>
  );
};
