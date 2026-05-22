"use client";

import { IconLoader2, IconPencil } from "@tabler/icons-react";
import Image from "next/image";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { uploadPlaylistCoverAction } from "@/app/_actions/uploads";
import { useLibrary } from "@/contexts/library-context";
import { gradientFromSeed } from "@/lib/seed-gradient";
import { cn } from "@/lib/utils";

export const CoverTile = ({
  url,
  name,
  playlistId,
}: {
  url: string | null;
  name: string;
  playlistId: string;
}) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const { playlists } = useLibrary();
  const [state, formAction, pending] = useActionState(
    uploadPlaylistCoverAction,
    { ok: false as const, error: "" },
  );

  const liveName = playlists.find((p) => p.id === playlistId)?.name ?? name;
  const currentUrl = state.ok ? state.coverUrl : url;
  const gradient = gradientFromSeed(liveName);
  const initial = liveName.trim().charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!active) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!tileRef.current?.contains(e.target as Node)) {
        setActive(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [active]);

  const handleTilePointerUp = (e: React.PointerEvent) => {
    if (window.matchMedia("(hover: hover)").matches) return;
    if (e.pointerType === "mouse") return;
    if (active && (e.target as HTMLElement).closest("label")) return;
    setActive((value) => !value);
  };

  return (
    <div
      ref={tileRef}
      data-active={active || undefined}
      className="group relative size-16 shrink-0 overflow-hidden rounded-md sm:size-20"
      onPointerUp={handleTilePointerUp}
    >
      {currentUrl ? (
        <Image
          src={currentUrl}
          alt="Playlist cover"
          fill
          unoptimized
          className="object-cover"
          sizes="80px"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundImage: gradient.backgroundImage }}
          aria-hidden
        >
          <span
            className="text-lg font-semibold select-none sm:text-xl"
            style={{ color: gradient.color }}
          >
            {initial}
          </span>
        </div>
      )}
      <form action={formAction} className="absolute inset-0">
        <input type="hidden" name="playlistId" value={playlistId} />
        <label
          htmlFor={`cover-upload-${playlistId}`}
          aria-label="Change playlist cover"
          className={cn(
            "absolute inset-0 flex cursor-pointer items-center justify-center transition-colors",
            "pointer-events-none opacity-0",
            "[@media(hover:hover)]:group-hover:pointer-events-auto [@media(hover:hover)]:group-hover:bg-black/40 [@media(hover:hover)]:group-hover:opacity-100",
            active &&
              "pointer-events-auto bg-black/40 opacity-100",
          )}
        >
          <input
            id={`cover-upload-${playlistId}`}
            type="file"
            name="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                alert("File exceeds 5MB limit");
                e.target.value = "";
                return;
              }
              setActive(false);
              startTransition(() => e.target.form?.requestSubmit());
            }}
          />
          <div className="rounded-full p-1.5">
            {pending ? (
              <IconLoader2 className="size-4 animate-spin text-white sm:size-5" />
            ) : (
              <IconPencil
                className={cn(
                  "size-4 text-white opacity-0 transition-opacity sm:size-5",
                  "[@media(hover:hover)]:group-hover:opacity-100",
                  active && "opacity-100",
                )}
              />
            )}
          </div>
        </label>
      </form>
    </div>
  );
};
