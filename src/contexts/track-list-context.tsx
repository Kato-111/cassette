"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { Track } from "@prisma/client";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
  type RefObject,
} from "react";
import {
  attachTrackAction,
  detachTracksAction,
  reorderPlaylistTracksAction,
} from "@/app/_actions/playlists";
import {
  deleteTracksAction,
  reorderLibraryTracksAction,
} from "@/app/_actions/tracks";
import type {
  TrackListRemoveScope,
  TrackListView,
} from "@/app/_components/track-list/types";
import { useDeck } from "@/contexts/deck-context";

type TrackListContextValue = {
  view: TrackListView;
  query?: string;
  tracks: Track[];
  reorderable: boolean;
  dragEnabled: boolean;
  selectable: boolean;
  removeScope: TrackListRemoveScope | null;
  removeBarLabel: string;
  removePending: boolean;
  inSelectionMode: boolean;
  selectedCount: number;
  allSelected: boolean;
  isSelected: (id: string) => boolean;
  toggleSelected: (id: string) => void;
  addToSelection: (id: string) => void;
  setSelectAll: (checked: boolean) => void;
  clearSelected: () => void;
  removeTrack: (trackId: string, scope?: TrackListRemoveScope) => void;
  removeSelected: () => void;
  addSelectedToPlaylist: (playlistId: string) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  focusedIndex: number;
  setFocusedId: (id: string | null) => void;
  registerRowRef: (id: string, el: HTMLTableRowElement | null) => void;
  getRowEl: (id: string) => HTMLTableRowElement | null;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  scrollToIndex: (index: number) => void;
  registerScrollToIndex: (fn: ((index: number) => void) | null) => void;
};

const TrackListContext = createContext<TrackListContextValue | null>(null);

const deriveViewConfig = (view: TrackListView, query?: string) => {
  const reorderable =
    view.kind !== "favorites" && view.kind !== "album";
  const removeScope: TrackListRemoveScope | null =
    view.kind === "favorites"
      ? null
      : view.kind === "playlist"
        ? "playlist"
        : "library";
  const selectable = removeScope !== null;
  const playlistId = view.kind === "playlist" ? view.playlistId : undefined;

  return {
    reorderable,
    removeScope,
    selectable,
    playlistId,
    dragEnabled: reorderable && !query,
  };
};

const pruneSelection = (
  selected: Set<string>,
  ids: Set<string>,
): Set<string> => {
  if (selected.size === 0) return selected;
  const next = new Set<string>();
  for (const id of selected) if (!ids.has(id)) next.add(id);
  return next.size === selected.size ? selected : next;
};

export const TrackListProvider = ({
  view,
  initialTracks,
  query,
  children,
}: {
  view: TrackListView;
  initialTracks: Track[];
  query?: string;
  children: ReactNode;
}) => {
  const router = useRouter();
  const { currentTrack, playFromContext, clearPlayback } = useDeck();
  const [tracks, setTracks] = useState(initialTracks);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removePending, startRemoveTransition] = useTransition();

  const { reorderable, removeScope, selectable, playlistId } = useMemo(
    () => deriveViewConfig(view, query),
    [view, query],
  );

  const inSelectionMode = selected.size > 0;
  const allSelected = tracks.length > 0 && selected.size === tracks.length;
  const dragEnabled = reorderable && !query && !inSelectionMode;

  const removeBarLabel =
    removeScope === "playlist" ? "Remove from playlist" : "Delete";

  useEffect(() => {
    setTracks(initialTracks);
    setSelected((current) => {
      if (current.size === 0) return current;
      const ids = new Set(initialTracks.map((t) => t.id));
      const next = new Set<string>();
      for (const id of current) if (ids.has(id)) next.add(id);
      return next.size === current.size ? current : next;
    });
  }, [initialTracks]);

  const isSelected = useCallback(
    (id: string) => selected.has(id),
    [selected],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const addToSelection = useCallback((id: string) => {
    setSelected((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  }, []);

  const clearSelected = useCallback(() => setSelected(new Set()), []);

  const setSelectAll = useCallback(
    (checked: boolean) => {
      setSelected(checked ? new Set(tracks.map((t) => t.id)) : new Set());
    },
    [tracks],
  );

  const removeFromList = useCallback(
    (ids: string[], scope: TrackListRemoveScope) => {
      if (ids.length === 0) return;
      if (scope === "playlist" && !playlistId) return;

      const snapshot = { tracks, selected };
      const removedIds = new Set(ids);
      const next = tracks.filter((t) => !removedIds.has(t.id));

      setTracks(next);
      setSelected((current) => pruneSelection(current, removedIds));

      startRemoveTransition(async () => {
        const result =
          scope === "playlist"
            ? await detachTracksAction(playlistId!, ids)
            : await deleteTracksAction(ids);

        if (!result.ok) {
          setTracks(snapshot.tracks);
          setSelected(snapshot.selected);
          return;
        }

        if (currentTrack && ids.includes(currentTrack.id)) {
          if (next.length > 0) {
            const idx = snapshot.tracks.findIndex((t) => t.id === currentTrack.id);
            const fallbackIndex = idx >= 0 ? Math.min(idx, next.length - 1) : 0;
            playFromContext(next, fallbackIndex);
          } else {
            clearPlayback();
          }
        }

        router.refresh();
      });
    },
    [
      playlistId,
      tracks,
      selected,
      currentTrack,
      playFromContext,
      clearPlayback,
      router,
    ],
  );

  const removeTrack = useCallback(
    (trackId: string, scope?: TrackListRemoveScope) => {
      if (!removeScope) return;
      removeFromList([trackId], scope ?? removeScope);
    },
    [removeFromList, removeScope],
  );

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const removeSelected = useCallback(() => {
    if (selectedIds.length === 0 || !removeScope) return;
    removeFromList(selectedIds, removeScope);
  }, [selectedIds, removeFromList, removeScope]);

  const addSelectedToPlaylist = useCallback(
    async (targetPlaylistId: string) => {
      if (selectedIds.length === 0) return;
      const results = await Promise.all(
        selectedIds.map((id) => attachTrackAction(targetPlaylistId, id)),
      );
      if (results.every((r) => r.ok)) {
        clearSelected();
        router.refresh();
      }
    },
    [selectedIds, clearSelected, router],
  );

  const [focusedId, setFocusedId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollToIndexRef = useRef<(index: number) => void>(() => {});

  const scrollToIndex = useCallback((index: number) => {
    scrollToIndexRef.current(index);
  }, []);

  const registerScrollToIndex = useCallback(
    (fn: ((index: number) => void) | null) => {
      scrollToIndexRef.current = fn ?? (() => {});
    },
    [],
  );

  const registerRowRef = useCallback(
    (id: string, el: HTMLTableRowElement | null) => {
      if (el) rowRefs.current.set(id, el);
      else rowRefs.current.delete(id);
    },
    [],
  );

  const getRowEl = useCallback(
    (id: string) => rowRefs.current.get(id) ?? null,
    [],
  );

  const focusedIndex = useMemo(() => {
    if (tracks.length === 0) return -1;
    if (focusedId) {
      const idx = tracks.findIndex((t) => t.id === focusedId);
      if (idx >= 0) return idx;
    }
    if (currentTrack) {
      const idx = tracks.findIndex((t) => t.id === currentTrack.id);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [focusedId, tracks, currentTrack]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !reorderable) return;

      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const next = arrayMove(tracks, oldIndex, newIndex);
      setTracks(next);

      const ids = next.map((t) => t.id);
      if (view.kind === "library") {
        void reorderLibraryTracksAction(ids);
      } else if (view.kind === "playlist") {
        void reorderPlaylistTracksAction(view.playlistId, ids);
      }
    },
    [tracks, reorderable, view],
  );

  const value = useMemo(
    () => ({
      view,
      query,
      tracks,
      reorderable,
      dragEnabled,
      selectable,
      removeScope,
      removeBarLabel,
      removePending,
      inSelectionMode,
      selectedCount: selectedIds.length,
      allSelected,
      isSelected,
      toggleSelected,
      addToSelection,
      setSelectAll,
      clearSelected,
      removeTrack,
      removeSelected,
      addSelectedToPlaylist,
      handleDragEnd,
      focusedIndex,
      setFocusedId,
      registerRowRef,
      getRowEl,
      scrollContainerRef,
      scrollToIndex,
      registerScrollToIndex,
    }),
    [
      view,
      query,
      tracks,
      reorderable,
      dragEnabled,
      selectable,
      removeScope,
      removeBarLabel,
      removePending,
      inSelectionMode,
      selectedIds.length,
      allSelected,
      isSelected,
      toggleSelected,
      addToSelection,
      setSelectAll,
      clearSelected,
      removeTrack,
      removeSelected,
      addSelectedToPlaylist,
      handleDragEnd,
      focusedIndex,
      registerRowRef,
      getRowEl,
      scrollToIndex,
      registerScrollToIndex,
    ],
  );

  return (
    <TrackListContext.Provider value={value}>
      {children}
    </TrackListContext.Provider>
  );
};

export const useTrackList = (): TrackListContextValue => {
  const ctx = useContext(TrackListContext);
  if (!ctx) {
    throw new Error("useTrackList must be used within TrackListProvider");
  }
  return ctx;
};
