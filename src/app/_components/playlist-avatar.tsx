import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { gradientFromSeed } from "@/lib/seed-gradient";
import { cn } from "@/lib/utils";

export const PlaylistAvatar = ({
  name,
  coverUrl,
  className,
}: {
  name: string;
  coverUrl: string | null;
  className?: string;
}) => {
  const gradient = gradientFromSeed(name);
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <Avatar className={cn("size-4 shrink-0 rounded-lg text-[9px]", className)}>
      {coverUrl ? <AvatarImage src={coverUrl} alt="" /> : null}
      <AvatarFallback
        className="rounded-lg bg-transparent font-semibold"
        style={{ backgroundImage: gradient.backgroundImage }}
      >
        <span style={{ color: gradient.color }}>{initial}</span>
      </AvatarFallback>
    </Avatar>
  );
};
