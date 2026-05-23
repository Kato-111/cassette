"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import type { Track } from "@prisma/client";
import { isTypingTarget } from "@/lib/keyboard";

export type Pane = "sidebar" | "tracklist";

export type QueueItem = {
  id: string;
  track: Track;
  /** True when explicitly added via addToUserQueue (shown in the queue panel). */
  inserted?: boolean;
};

type PlaybackState = {
  entries: QueueItem[];
  index: number;
};

type DeckContextValue = {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  userQueue: QueueItem[];
  togglePlayPause: () => void;
  playTrack: (track: Track) => void;
  playFromContext: (tracks: Track[], index: number) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  setCurrentTime: (time: number) => void;
  addToUserQueue: (tracks: Track[]) => void;
  removeFromUserQueue: (itemId: string) => void;
  reorderUserQueue: (activeId: string, overId: string) => void;
  clearUserQueue: () => void;
  patchTrack: (id: string, partial: Partial<Track>) => void;
  clearPlayback: () => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  setAudioElement: (audio: HTMLAudioElement | null) => void;
  activePane: Pane;
  setActivePane: (pane: Pane) => void;
  registerPaneRef: (pane: Pane, ref: RefObject<HTMLElement | null>) => void;
  handlePaneKey: (e: React.KeyboardEvent, pane: Pane) => void;
};

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

const EMPTY_PLAYBACK: PlaybackState = { entries: [], index: -1 };

const streamUrlFor = (storageKey: string): string => {
  const segments = storageKey.split("/").map(encodeURIComponent).join("/");
  return `/api/stream/${segments}`;
};

const makeQueueItem = (track: Track, inserted = false): QueueItem => ({
  id: crypto.randomUUID(),
  track,
  ...(inserted ? { inserted: true } : {}),
});

const patchQueueItemTrack = (
  item: QueueItem,
  id: string,
  partial: Partial<Track>,
): QueueItem =>
  item.track.id === id ? { ...item, track: { ...item.track, ...partial } } : item;

/** play() rejects with AbortError when pause() runs before it settles — ignore that. */
const safePlay = (audio: HTMLAudioElement): void => {
  const promise = audio.play();
  if (promise === undefined) return;
  void promise.catch((err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") return;
    console.error("Playback failed:", err);
  });
};

const usePaneNav = () => {
  const [activePane, setActivePane] = useState<Pane>("sidebar");
  const refs = useRef<Record<Pane, RefObject<HTMLElement | null> | null>>({
    sidebar: null,
    tracklist: null,
  });

  const registerPaneRef = useCallback(
    (pane: Pane, ref: RefObject<HTMLElement | null>) => {
      refs.current[pane] = ref;
    },
    [],
  );

  const handlePaneKey = useCallback(
    (e: React.KeyboardEvent, pane: Pane) => {
      if (isTypingTarget(e.target)) return;

      const current = refs.current[pane];
      if (!current?.current) return;

      const items = Array.from(
        current.current.querySelectorAll<HTMLElement>('[tabindex="0"]'),
      );
      const index = items.indexOf(document.activeElement as HTMLElement);

      switch (e.key) {
        case "ArrowDown":
        case "j": {
          e.preventDefault();
          const next = (index + 1) % items.length;
          items[next]?.focus();
          break;
        }
        case "ArrowUp":
        case "k": {
          e.preventDefault();
          const prev = (index - 1 + items.length) % items.length;
          items[prev]?.focus();
          break;
        }
        case "h": {
          if (pane === "tracklist") {
            e.preventDefault();
            setActivePane("sidebar");
            refs.current.sidebar?.current
              ?.querySelector<HTMLElement>('[tabindex="0"]')
              ?.focus();
          }
          break;
        }
        case "l": {
          if (pane === "sidebar") {
            e.preventDefault();
            setActivePane("tracklist");
            refs.current.tracklist?.current
              ?.querySelector<HTMLElement>('[tabindex="0"]')
              ?.focus();
          }
          break;
        }
      }
    },
    [],
  );

  return { activePane, setActivePane, registerPaneRef, handlePaneKey };
};

export const DeckProvider = ({ children }: { children: ReactNode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [playback, setPlayback] = useState<PlaybackState>(EMPTY_PLAYBACK);
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioCleanupRef = useRef<(() => void) | null>(null);
  const playNextTrackRef = useRef<() => void>(() => {});
  const playbackRef = useRef(playback);

  playbackRef.current = playback;

  const { activePane, setActivePane, registerPaneRef, handlePaneKey } =
    usePaneNav();

  const userQueue = useMemo(
    () =>
      playback.entries
        .slice(playback.index + 1)
        .filter((entry) => entry.inserted),
    [playback.entries, playback.index],
  );

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (audio.paused) {
      safePlay(audio);
    } else {
      audio.pause();
    }
  }, [currentTrack]);

  const playTrack = useCallback(
    (track: Track) => {
      setCurrentTrack(track);
      setCurrentTime(0);
      setAudioDuration(0);
      const audio = audioRef.current;
      if (audio) {
        audio.src = streamUrlFor(track.storageKey);
        safePlay(audio);
      }
      setActivePane("tracklist");
    },
    [setActivePane],
  );

  const playFromContext = useCallback(
    (tracks: Track[], index: number) => {
      const track = tracks[index];
      if (!track) return;
      setPlayback({
        entries: tracks.map((t) => makeQueueItem(t)),
        index,
      });
      playTrack(track);
    },
    [playTrack],
  );

  const setAudioElement = useCallback((audio: HTMLAudioElement | null) => {
    audioCleanupRef.current?.();
    audioCleanupRef.current = null;
    audioRef.current = audio;
    if (!audio) return;

    const tick = () => setCurrentTime(audio.currentTime);
    const onDuration = () => {
      if (Number.isFinite(audio.duration)) setAudioDuration(audio.duration);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => playNextTrackRef.current();

    audio.addEventListener("timeupdate", tick);
    audio.addEventListener("loadedmetadata", onDuration);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    audioCleanupRef.current = () => {
      audio.removeEventListener("timeupdate", tick);
      audio.removeEventListener("loadedmetadata", onDuration);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const playNextTrack = useCallback(() => {
    const { entries, index } = playbackRef.current;
    if (index < 0 || index >= entries.length - 1) return;

    const nextIndex = index + 1;
    const next = entries[nextIndex];
    if (!next) return;

    setPlayback({ entries, index: nextIndex });
    playTrack(next.track);
  }, [playTrack]);

  const playPreviousTrack = useCallback(() => {
    const { entries, index } = playbackRef.current;
    if (index <= 0) return;

    const prevIndex = index - 1;
    const prev = entries[prevIndex];
    if (!prev) return;

    setPlayback({ entries, index: prevIndex });
    playTrack(prev.track);
  }, [playTrack]);

  const addToUserQueue = useCallback(
    (tracks: Track[]) => {
      if (tracks.length === 0) return;

      const { entries, index } = playbackRef.current;
      if (index < 0 || !currentTrack) {
        playFromContext(tracks, 0);
        return;
      }

      setPlayback((prev) => {
        let nextEntries = prev.entries;
        let cursor = prev.index;

        for (const track of tracks) {
          const insertAt = cursor + 1;
          const existing = nextEntries[insertAt];

          if (existing?.track.id === track.id) {
            nextEntries = nextEntries.map((entry, i) =>
              i === insertAt ? { ...entry, inserted: true } : entry,
            );
          } else {
            nextEntries = [
              ...nextEntries.slice(0, insertAt),
              makeQueueItem(track, true),
              ...nextEntries.slice(insertAt),
            ];
          }
          cursor += 1;
        }

        return { entries: nextEntries, index: prev.index };
      });
    },
    [playFromContext, currentTrack],
  );

  const removeFromUserQueue = useCallback((itemId: string) => {
    setPlayback((prev) => {
      const removeIndex = prev.entries.findIndex((e) => e.id === itemId);
      if (removeIndex < 0 || !prev.entries[removeIndex]?.inserted) return prev;

      const entries = prev.entries.filter((e) => e.id !== itemId);
      const index =
        removeIndex <= prev.index ? Math.max(0, prev.index - 1) : prev.index;
      return { entries, index };
    });
  }, []);

  const reorderUserQueue = useCallback((activeId: string, overId: string) => {
    setPlayback((prev) => {
      const oldIndex = prev.entries.findIndex((e) => e.id === activeId);
      const newIndex = prev.entries.findIndex((e) => e.id === overId);
      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return prev;

      const active = prev.entries[oldIndex];
      const over = prev.entries[newIndex];
      if (!active?.inserted || !over?.inserted) return prev;
      if (oldIndex <= prev.index || newIndex <= prev.index) return prev;

      const entries = [...prev.entries];
      const [moved] = entries.splice(oldIndex, 1);
      entries.splice(newIndex, 0, moved!);
      return { ...prev, entries };
    });
  }, []);

  const clearUserQueue = useCallback(() => {
    setPlayback((prev) => ({
      entries: prev.entries.filter(
        (entry, i) => i <= prev.index || !entry.inserted,
      ),
      index: prev.index,
    }));
  }, []);

  const patchTrack = useCallback((id: string, partial: Partial<Track>) => {
    setCurrentTrack((t) => (t?.id === id ? { ...t, ...partial } : t));
    setPlayback((prev) => ({
      ...prev,
      entries: prev.entries.map((item) =>
        patchQueueItemTrack(item, id, partial),
      ),
    }));
  }, []);

  const clearPlayback = useCallback(() => {
    setCurrentTrack(null);
    setCurrentTime(0);
    setAudioDuration(0);
    setIsPlaying(false);
    setPlayback(EMPTY_PLAYBACK);
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
  }, []);

  playNextTrackRef.current = playNextTrack;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "/") {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        const search =
          document.querySelector<HTMLInputElement>('input[type="search"]');
        search?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayPause]);

  const duration =
    currentTrack && currentTrack.durationSec > 0
      ? currentTrack.durationSec
      : audioDuration > 0
        ? Math.round(audioDuration)
        : 0;

  const value = useMemo(
    () => ({
      isPlaying,
      currentTrack,
      currentTime,
      duration,
      userQueue,
      togglePlayPause,
      playTrack,
      playFromContext,
      playNextTrack,
      playPreviousTrack,
      setCurrentTime,
      addToUserQueue,
      removeFromUserQueue,
      reorderUserQueue,
      clearUserQueue,
      patchTrack,
      clearPlayback,
      audioRef,
      setAudioElement,
      activePane,
      setActivePane,
      registerPaneRef,
      handlePaneKey,
    }),
    [
      isPlaying,
      currentTrack,
      currentTime,
      duration,
      userQueue,
      togglePlayPause,
      playTrack,
      playFromContext,
      playNextTrack,
      playPreviousTrack,
      activePane,
      setActivePane,
      registerPaneRef,
      handlePaneKey,
      setAudioElement,
      addToUserQueue,
      removeFromUserQueue,
      reorderUserQueue,
      clearUserQueue,
      patchTrack,
      clearPlayback,
    ],
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
};

export const useDeck = (): DeckContextValue => {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error("useDeck must be used within DeckProvider");
  return ctx;
};
