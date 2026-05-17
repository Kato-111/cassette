"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { renameCollectionAction } from "@/app/_actions/collections";
import { useLibrary } from "@/app/_hooks/use-library";

export const TitleField = ({
  collectionId,
  initialName,
}: {
  collectionId: string;
  initialName: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);
  const { patchCollection } = useLibrary();

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
      patchCollection(collectionId, { name: trimmed });
    });
    await renameCollectionAction(collectionId, trimmed);
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
