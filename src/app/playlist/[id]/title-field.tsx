"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { renamePlaylistAction } from "@/app/_actions/playlists";
import { useLibrary } from "@/app/_hooks/use-library";

export const TitleField = ({
  playlistId,
  initialName,
}: {
  playlistId: string;
  initialName: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { patchPlaylist } = useLibrary();

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setName(initialName);
  }, [initialName]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === initialName) {
      setName(initialName);
      return;
    }
    startTransition(() => {
      patchPlaylist(playlistId, { name: trimmed });
    });
    await renamePlaylistAction(playlistId, trimmed);
  };

  if (editing) {
    return (
      <form onSubmit={submit}>
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setEditing(false)}
          className="border-none bg-transparent text-xl font-bold focus-visible:ring-0 sm:text-2xl"
        />
      </form>
    );
  }

  return (
    <h1
      tabIndex={0}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      className="cursor-pointer text-xl font-bold sm:text-2xl"
    >
      {name}
    </h1>
  );
};
