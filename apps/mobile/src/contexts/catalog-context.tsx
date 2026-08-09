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
import type { Album, Catalog, Playlist, Track } from "@/lib/types";

type CatalogContextValue = {
  tracks: Track[];
  albums: Album[];
  playlists: Playlist[];
  favorites: Track[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  setFavorite: (track: Track, value: boolean) => Promise<void>;
  createPlaylist: (name: string) => Promise<Playlist>;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export const CatalogProvider = ({ children }: { children: ReactNode }) => {
  const [catalog, setCatalog] = useState<Catalog>({
    tracks: [],
    albums: [],
    playlists: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      setCatalog(await api.catalog());
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load music");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const setFavorite = useCallback(async (track: Track, value: boolean) => {
    setCatalog((current) => ({
      ...current,
      tracks: current.tracks.map((item) =>
        item.id === track.id ? { ...item, isFavorite: value } : item,
      ),
    }));
    try {
      await api.favorite(track.id, value);
    } catch (error) {
      setCatalog((current) => ({
        ...current,
        tracks: current.tracks.map((item) =>
          item.id === track.id ? { ...item, isFavorite: !value } : item,
        ),
      }));
      throw error;
    }
  }, []);

  const createPlaylist = useCallback(async (name: string) => {
    const playlist = await api.createPlaylist(name);
    setCatalog((current) => ({
      ...current,
      playlists: [playlist, ...current.playlists],
    }));
    return playlist;
  }, []);

  const value = useMemo<CatalogContextValue>(
    () => ({
      ...catalog,
      favorites: catalog.tracks.filter((track) => track.isFavorite),
      loading,
      refreshing,
      error,
      refresh: () => load(true),
      setFavorite,
      createPlaylist,
    }),
    [catalog, loading, refreshing, error, load, setFavorite, createPlaylist],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider");
  return context;
};
