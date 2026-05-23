"use client";

import { useCallback, useRef } from "react";
import type { Track } from "@prisma/client";
import { useDeck } from "@/contexts/deck-context";
import { useTrackList } from "@/contexts/track-list-context";
import { isTypingTarget } from "@/lib/keyboard";

const TYPEAHEAD_TIMEOUT_MS = 500;
const RESERVED_LETTERS = new Set(["j", "k", "x"]);

const isTypeaheadKey = (e: React.KeyboardEvent): boolean => {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;
  if (e.key.length !== 1) return false;
  const ch = e.key.toLowerCase();
  if (RESERVED_LETTERS.has(ch)) return false;
  return /^[a-z0-9]$/.test(ch);
};

const focusRow = (el: HTMLTableRowElement | null) => {
  if (!el) return;
  el.focus({ preventScroll: true });
};

export const useTrackListKeyboard = () => {
  const {
    tracks,
    focusedIndex,
    setFocusedId,
    getRowEl,
    scrollToIndex,
    selectable,
    toggleSelected,
    addToSelection,
    selectedCount,
  } = useTrackList();
  const { playFromContext, togglePlayPause, currentTrack } = useDeck();

  const typeaheadRef = useRef<{ buffer: string; timer: number | null }>({
    buffer: "",
    timer: null,
  });

  const moveTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= tracks.length) return;
      const track = tracks[index];
      setFocusedId(track.id);
      scrollToIndex(index);
      requestAnimationFrame(() => {
        focusRow(getRowEl(track.id));
      });
    },
    [tracks, setFocusedId, scrollToIndex, getRowEl],
  );

  const runTypeahead = useCallback(
    (ch: string) => {
      const state = typeaheadRef.current;
      if (state.timer !== null) window.clearTimeout(state.timer);
      state.buffer += ch.toLowerCase();
      state.timer = window.setTimeout(() => {
        state.buffer = "";
        state.timer = null;
      }, TYPEAHEAD_TIMEOUT_MS);

      const buffer = state.buffer;
      const startFrom = focusedIndex >= 0 ? focusedIndex : 0;
      const offset = buffer.length === 1 ? 1 : 0;
      const findMatch = (track: Track) =>
        track.title.toLowerCase().startsWith(buffer);

      for (let i = 0; i < tracks.length; i++) {
        const idx = (startFrom + offset + i) % tracks.length;
        if (findMatch(tracks[idx])) {
          moveTo(idx);
          return;
        }
      }
    },
    [focusedIndex, tracks, moveTo],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (tracks.length === 0) return;

      const current = focusedIndex >= 0 ? focusedIndex : 0;

      switch (e.key) {
        case "ArrowDown":
        case "j": {
          e.preventDefault();
          const next = (current + 1) % tracks.length;
          if (e.shiftKey && selectable) addToSelection(tracks[next].id);
          moveTo(next);
          return;
        }
        case "ArrowUp":
        case "k": {
          e.preventDefault();
          const prev = (current - 1 + tracks.length) % tracks.length;
          if (e.shiftKey && selectable) addToSelection(tracks[prev].id);
          moveTo(prev);
          return;
        }
        case "Home": {
          e.preventDefault();
          moveTo(0);
          return;
        }
        case "End": {
          e.preventDefault();
          moveTo(tracks.length - 1);
          return;
        }
        case "Enter": {
          if (focusedIndex < 0) return;
          e.preventDefault();
          playFromContext(tracks, focusedIndex);
          return;
        }
        case " ": {
          if (!currentTrack) return;
          e.preventDefault();
          togglePlayPause();
          return;
        }
        case "x":
        case "X": {
          if (!selectable || focusedIndex < 0) return;
          e.preventDefault();
          toggleSelected(tracks[focusedIndex].id);
          return;
        }
        case "Escape": {
          if (selectedCount > 0) return;
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur?.();
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          return;
        }
      }

      if (isTypeaheadKey(e)) {
        e.preventDefault();
        runTypeahead(e.key);
      }
    },
    [
      tracks,
      focusedIndex,
      selectable,
      selectedCount,
      addToSelection,
      toggleSelected,
      moveTo,
      playFromContext,
      togglePlayPause,
      currentTrack,
      runTypeahead,
    ],
  );

  return handleKeyDown;
};
