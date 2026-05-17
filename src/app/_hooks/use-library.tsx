"use client";

import {
  createContext,
  use,
  useContext,
  useMemo,
  useOptimistic,
  type ReactNode,
} from "react";
import type { Collection } from "@prisma/client";

type LibraryAction =
  | { type: "upsert"; collection: Collection }
  | { type: "patch"; id: string; patch: Partial<Collection> }
  | { type: "remove"; id: string };

type LibraryContextValue = {
  collections: Collection[];
  upsertCollection: (collection: Collection) => void;
  patchCollection: (id: string, patch: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

const reducer = (state: Collection[], action: LibraryAction): Collection[] => {
  switch (action.type) {
    case "upsert": {
      const exists = state.some((c) => c.id === action.collection.id);
      return exists
        ? state.map((c) =>
            c.id === action.collection.id ? action.collection : c,
          )
        : [action.collection, ...state];
    }
    case "patch":
      return state.map((c) =>
        c.id === action.id ? { ...c, ...action.patch } : c,
      );
    case "remove":
      return state.filter((c) => c.id !== action.id);
  }
};

export const LibraryProvider = ({
  collectionsPromise,
  children,
}: {
  collectionsPromise: Promise<Collection[]>;
  children: ReactNode;
}) => {
  const initial = use(collectionsPromise);
  const [collections, dispatch] = useOptimistic(initial, reducer);

  const value = useMemo<LibraryContextValue>(
    () => ({
      collections,
      upsertCollection: (collection) =>
        dispatch({ type: "upsert", collection }),
      patchCollection: (id, patch) => dispatch({ type: "patch", id, patch }),
      removeCollection: (id) => dispatch({ type: "remove", id }),
    }),
    [collections, dispatch],
  );

  return (
    <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>
  );
};

export const useLibrary = (): LibraryContextValue => {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
};
