"use client";

import {
  createContext,
  useContext,
  useMemo,
  useOptimistic,
  type ReactNode,
} from "react";
import type { Playlist } from "@/generated/prisma";
import type { AlbumSummary } from "@/lib/albums";

type LibraryAction =
  | { type: "upsert"; playlist: Playlist }
  | { type: "patch"; id: string; patch: Partial<Playlist> }
  | { type: "remove"; id: string };

type LibraryContextValue = {
  playlists: Playlist[];
  albums: AlbumSummary[];
  upsertPlaylist: (playlist: Playlist) => void;
  patchPlaylist: (id: string, patch: Partial<Playlist>) => void;
  removePlaylist: (id: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export const libraryReducer = (
  state: Playlist[],
  action: LibraryAction,
): Playlist[] => {
  switch (action.type) {
    case "upsert": {
      const exists = state.some((p) => p.id === action.playlist.id);
      return exists
        ? state.map((p) =>
            p.id === action.playlist.id ? action.playlist : p,
          )
        : [action.playlist, ...state];
    }
    case "patch":
      return state.map((p) =>
        p.id === action.id ? { ...p, ...action.patch } : p,
      );
    case "remove":
      return state.filter((p) => p.id !== action.id);
  }
};

export const LibraryProvider = ({
  initialPlaylists,
  initialAlbums,
  children,
}: {
  initialPlaylists: Playlist[];
  initialAlbums: AlbumSummary[];
  children: ReactNode;
}) => {
  const [playlists, dispatch] = useOptimistic(initialPlaylists, libraryReducer);

  const value = useMemo(
    () => ({
      playlists,
      albums: initialAlbums,
      upsertPlaylist: (playlist: Playlist) =>
        dispatch({ type: "upsert", playlist }),
      patchPlaylist: (id: string, patch: Partial<Playlist>) =>
        dispatch({ type: "patch", id, patch }),
      removePlaylist: (id: string) => dispatch({ type: "remove", id }),
    }),
    [playlists, initialAlbums, dispatch],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
};
