import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import type { Catalog, Playlist, Track } from "@/lib/types";

type CatalogContextValue = {
  catalog: Catalog;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setFavorite: (track: Track, isFavorite: boolean) => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
};

const EMPTY_CATALOG: Catalog = {
  tracks: [],
  albums: [],
  playlists: [],
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(EMPTY_CATALOG);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refreshing = false) => {
    if (refreshing) setRefreshing(true);
    else setLoading(true);

    try {
      setCatalog(await api.catalog());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load catalog");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const setFavorite = useCallback(async (track: Track, isFavorite: boolean) => {
    setCatalog((current) => ({
      ...current,
      tracks: current.tracks.map((item) =>
        item.id === track.id ? { ...item, isFavorite } : item,
      ),
    }));

    try {
      await api.favorite(track.id, isFavorite);
    } catch (cause) {
      setCatalog((current) => ({
        ...current,
        tracks: current.tracks.map((item) =>
          item.id === track.id ? { ...item, isFavorite: track.isFavorite } : item,
        ),
      }));
      throw cause;
    }
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    const playlist = await api.createPlaylist(name.trim());
    setCatalog((current) => ({
      ...current,
      playlists: [...current.playlists, playlist],
    }));
    return playlist;
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      catalog,
      loading,
      refreshing,
      error,
      refresh: () => load(true),
      setFavorite,
      createPlaylist,
    }),
    [
      catalog,
      createPlaylist,
      error,
      load,
      loading,
      refreshing,
      setFavorite,
    ],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider");
  return context;
}
