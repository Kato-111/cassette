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

export type Pane = "sidebar" | "tracklist";

type DeckContextValue = {
  isPlaying: boolean;
  currentTrack: Track | null;
  currentTime: number;
  duration: number;
  togglePlayPause: () => void;
  playTrack: (track: Track) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setQueue: (tracks: Track[]) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  activePane: Pane;
  setActivePane: (pane: Pane) => void;
  registerPaneRef: (pane: Pane, ref: RefObject<HTMLElement | null>) => void;
  handlePaneKey: (e: React.KeyboardEvent, pane: Pane) => void;
};

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

const streamUrlFor = (storageKey: string): string => {
  const segments = storageKey.split("/").map(encodeURIComponent).join("/");
  return `/api/stream/${segments}`;
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
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { activePane, setActivePane, registerPaneRef, handlePaneKey } =
    usePaneNav();

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  }, [currentTrack, isPlaying]);

  const playTrack = useCallback(
    (track: Track) => {
      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);
      const audio = audioRef.current;
      if (audio) {
        audio.src = streamUrlFor(track.storageKey);
        void audio.play();
      }
      setActivePane("tracklist");
    },
    [setActivePane],
  );

  const playNextTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const i = queue.findIndex((t) => t.id === currentTrack.id);
    const next = (i + 1) % queue.length;
    playTrack(queue[next]);
  }, [currentTrack, queue, playTrack]);

  const playPreviousTrack = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const i = queue.findIndex((t) => t.id === currentTrack.id);
    const prev = (i - 1 + queue.length) % queue.length;
    playTrack(queue[prev]);
  }, [currentTrack, queue, playTrack]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "/") {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
          return;
        }
        e.preventDefault();
        const search =
          document.querySelector<HTMLInputElement>('input[type="search"]');
        search?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayPause]);

  const value = useMemo(
    () => ({
      isPlaying,
      currentTrack,
      currentTime,
      duration,
      togglePlayPause,
      playTrack,
      playNextTrack,
      playPreviousTrack,
      setCurrentTime,
      setDuration,
      setQueue,
      audioRef,
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
      togglePlayPause,
      playTrack,
      playNextTrack,
      playPreviousTrack,
      activePane,
      setActivePane,
      registerPaneRef,
      handlePaneKey,
    ],
  );

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
};

export const useDeck = (): DeckContextValue => {
  const ctx = useContext(DeckContext);
  if (!ctx) throw new Error("useDeck must be used within DeckProvider");
  return ctx;
};
