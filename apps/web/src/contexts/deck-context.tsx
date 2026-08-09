"use client";

import { Provider, createStore, useAtomValue, useSetAtom } from "jotai";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isTypingTarget } from "@/lib/keyboard";
import {
  activePaneAtom,
  addToUserQueueAtom,
  audioDurationAtom,
  audioRef,
  clearPlaybackAtom,
  clearUserQueueAtom,
  currentTimeAtom,
  currentTrackAtom,
  deckRefs,
  durationAtom,
  handlePaneKey as handlePaneKeyImpl,
  isPlayingAtom,
  isShuffledAtom,
  patchTrackAtom,
  playFromContextAtom,
  playNextTrackAtom,
  playPreviousTrackAtom,
  playTrackAtom,
  registerPaneRef,
  removeFromUserQueueAtom,
  reorderUserQueueAtom,
  resetDeckAtoms,
  setActivePaneAtom,
  setCurrentTimeAtom,
  togglePlayPauseAtom,
  toggleShuffleAtom,
  userQueueAtom,
  type Pane,
  type QueueItem,
} from "@/contexts/deck-atoms";

export type { Pane, QueueItem };
export { audioRef, registerPaneRef };

export const useCurrentTrack = () => useAtomValue(currentTrackAtom);
export const useIsPlaying = () => useAtomValue(isPlayingAtom);
export const useIsShuffled = () => useAtomValue(isShuffledAtom);
export const useCurrentTime = () => useAtomValue(currentTimeAtom);
export const useDuration = () => useAtomValue(durationAtom);
export const useUserQueue = () => useAtomValue(userQueueAtom);
export const useActivePane = () => useAtomValue(activePaneAtom);

export const useTogglePlayPause = () => useSetAtom(togglePlayPauseAtom);
export const useToggleShuffle = () => useSetAtom(toggleShuffleAtom);
export const usePlayTrack = () => useSetAtom(playTrackAtom);
export const usePlayFromContext = () => useSetAtom(playFromContextAtom);
export const usePlayNextTrack = () => useSetAtom(playNextTrackAtom);
export const usePlayPreviousTrack = () => useSetAtom(playPreviousTrackAtom);
export const useSetCurrentTime = () => useSetAtom(setCurrentTimeAtom);
export const useAddToUserQueue = () => useSetAtom(addToUserQueueAtom);
export const useRemoveFromUserQueue = () => useSetAtom(removeFromUserQueueAtom);
export const useReorderUserQueue = () => useSetAtom(reorderUserQueueAtom);
export const useClearUserQueue = () => useSetAtom(clearUserQueueAtom);
export const usePatchTrack = () => useSetAtom(patchTrackAtom);
export const useClearPlayback = () => useSetAtom(clearPlaybackAtom);
export const useSetActivePane = () => useSetAtom(setActivePaneAtom);

export const useDeckPane = () => {
  const setActivePane = useSetAtom(setActivePaneAtom);
  const activePane = useAtomValue(activePaneAtom);

  const handlePaneKey = useCallback(
    (e: React.KeyboardEvent, pane: Pane) => {
      handlePaneKeyImpl(e, pane, setActivePane);
    },
    [setActivePane],
  );

  return { activePane, setActivePane, registerPaneRef, handlePaneKey };
};

export const useSetAudioElement = () => {
  const setIsPlaying = useSetAtom(isPlayingAtom);
  const setCurrentTime = useSetAtom(setCurrentTimeAtom);
  const setAudioDuration = useSetAtom(audioDurationAtom);
  const playNextTrack = useSetAtom(playNextTrackAtom);
  const audioCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    deckRefs.playNextTrack.current = playNextTrack;
  }, [playNextTrack]);

  return useCallback(
    (audio: HTMLAudioElement | null) => {
      audioCleanupRef.current?.();
      audioCleanupRef.current = null;
      deckRefs.audio.current = audio;
      if (!audio) return;

      const tick = () => setCurrentTime(audio.currentTime);
      const onDuration = () => {
        if (Number.isFinite(audio.duration)) setAudioDuration(audio.duration);
      };
      const onPlay = () => setIsPlaying(true);
      const onPause = () => setIsPlaying(false);
      const onEnded = () => deckRefs.playNextTrack.current();

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
    },
    [setAudioDuration, setCurrentTime, setIsPlaying],
  );
};

const DeckKeyboardShortcuts = () => {
  const togglePlayPause = useSetAtom(togglePlayPauseAtom);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === "/") {
        if (isTypingTarget(e.target)) return;
        e.preventDefault();
        const search = document.querySelector<HTMLInputElement>(
          'input[type="search"]',
        );
        search?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlayPause]);

  return null;
};

export const DeckProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createStore());

  useEffect(
    () => () => {
      resetDeckAtoms(store.set.bind(store));
    },
    [store],
  );

  return (
    <Provider store={store}>
      <DeckKeyboardShortcuts />
      {children}
    </Provider>
  );
};
