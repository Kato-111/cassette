"use client";

import { IconCheck, IconLoader2, IconPencil } from "@tabler/icons-react";
import Image from "next/image";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import { updateTrackFieldAction } from "@/app/_actions/tracks";
import { uploadTrackArtworkAction } from "@/app/_actions/uploads";
import { FavoriteButton } from "@/app/_components/favorite-button";
import { useDeck } from "@/contexts/deck-context";
import { cn } from "@/lib/utils";

type EditableField = "title" | "artist" | "album" | "genre";

const EditableInput = ({
  trackId,
  field,
  label,
  initialValue,
}: {
  trackId: string;
  field: EditableField;
  label: string;
  initialValue: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, pending] = useActionState(updateTrackFieldAction, {
    ok: false as const,
    error: "",
  });

  useEffect(() => {
    setValue(initialValue);
    setEditing(false);
    setJustSaved(false);
  }, [initialValue, trackId]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (state.ok) {
      setJustSaved(true);
      const t = window.setTimeout(() => setJustSaved(false), 1500);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  const submit = () => {
    if (value.trim() === "" || value === initialValue) {
      setEditing(false);
      setValue(initialValue);
      return;
    }
    formRef.current?.requestSubmit();
    setEditing(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setEditing(false);
      setValue(initialValue);
    }
  };

  const error = !state.ok && state.error ? state.error : null;

  return (
    <div className="group space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="flex h-5 items-center justify-between border-b border-transparent text-sm focus-within:border-ring">
        {editing ? (
          <form ref={formRef} action={formAction} className="w-full">
            <input type="hidden" name="trackId" value={trackId} />
            <input type="hidden" name="field" value={field} />
            <input
              ref={inputRef}
              type="text"
              name={field}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKey}
              onBlur={submit}
              className={cn(
                "w-full bg-transparent p-0 focus:outline-none",
                error && "text-destructive",
              )}
            />
          </form>
        ) : (
          <button
            type="button"
            className="block w-full cursor-pointer truncate text-left"
            onClick={() => setEditing(true)}
          >
            <span className={value ? "" : "text-muted-foreground"}>
              {value || "—"}
            </span>
          </button>
        )}
        <div className="flex items-center">
          {pending ? (
            <IconLoader2 className="size-3 animate-spin" />
          ) : justSaved ? (
            <IconCheck className="size-3 text-emerald-500" />
          ) : !editing ? (
            <IconPencil className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
          ) : null}
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export const NowPlayingPanel = () => {
  const { currentTrack } = useDeck();
  const [artworkState, artworkAction, artworkPending] = useActionState(
    uploadTrackArtworkAction,
    { ok: false as const, error: "" },
  );
  const [showPencil, setShowPencil] = useState(true);

  useEffect(() => {
    if (artworkPending) {
      setShowPencil(false);
      return;
    }
    const t = window.setTimeout(() => setShowPencil(true), 300);
    return () => window.clearTimeout(t);
  }, [artworkPending]);

  if (!currentTrack) return null;

  const artworkUrl = artworkState.ok
    ? artworkState.artworkUrl
    : currentTrack.artworkUrl;

  return (
    <aside className="m-2 ml-0 hidden w-72 flex-col overflow-auto rounded-xl border border-white/12 bg-background p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.05),0_4px_12px_rgb(0_0_0/0.6)] lg:flex">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Now Playing</h2>
        <FavoriteButton
          trackId={currentTrack.id}
          isFavorite={currentTrack.isFavorite}
        />
      </div>
      <div className="group relative mx-auto mb-5 aspect-square w-full max-w-56 overflow-hidden rounded-lg bg-muted shadow-lg shadow-black/40">
        {artworkUrl ? (
          <Image
            src={artworkUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="224px"
          />
        ) : null}
        <form action={artworkAction} className="absolute inset-0">
          <input type="hidden" name="trackId" value={currentTrack.id} />
          <label
            htmlFor="artwork-upload"
            className="absolute inset-0 flex cursor-pointer items-center justify-center transition-colors group-hover:bg-black/40"
          >
            <input
              id="artwork-upload"
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
                startTransition(() => e.target.form?.requestSubmit());
              }}
            />
            <div className="rounded-full p-2">
              {artworkPending ? (
                <IconLoader2 className="size-5 animate-spin text-white" />
              ) : showPencil ? (
                <IconPencil className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
              ) : null}
            </div>
          </label>
        </form>
      </div>
      <div className="space-y-3">
        <EditableInput
          trackId={currentTrack.id}
          field="title"
          label="Title"
          initialValue={currentTrack.title}
        />
        <EditableInput
          trackId={currentTrack.id}
          field="artist"
          label="Artist"
          initialValue={currentTrack.artist}
        />
        <EditableInput
          trackId={currentTrack.id}
          field="album"
          label="Album"
          initialValue={currentTrack.album ?? ""}
        />
        <EditableInput
          trackId={currentTrack.id}
          field="genre"
          label="Genre"
          initialValue={currentTrack.genre ?? ""}
        />
      </div>
    </aside>
  );
};
