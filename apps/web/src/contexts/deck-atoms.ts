import { atom, type Setter } from "jotai";
import type { RefObject } from "react";
import type { Track } from "@/generated/prisma";
import { isTypingTarget } from "@/lib/keyboard";

export type Pane = "sidebar" | "tracklist";

export type QueueItem = {
  id: string;
  track: Track;
  inserted?: boolean;
};

type PlaybackState = {
  entries: QueueItem[];
  index: number;
  /** Pre-shuffle queue order; present only while shuffle is active. */
  unshuffledEntries?: QueueItem[];
};

export const EMPTY_PLAYBACK: PlaybackState = { entries: [], index: -1 };

const withPlaybackEntries = (
  prev: PlaybackState,
  entries: QueueItem[],
  index: number,
): PlaybackState => ({
  entries,
  index,
  ...(prev.unshuffledEntries !== undefined
    ? { unshuffledEntries: prev.unshuffledEntries }
    : {}),
});

const shufflePlaybackEntries = (
  entries: QueueItem[],
  index: number,
): Pick<PlaybackState, "entries" | "index" | "unshuffledEntries"> => {
  const current = entries[index];
  const after = entries.slice(index + 1);
  const pinned = after.filter((e) => e.inserted);
  const pool = [
    ...entries.slice(0, index),
    ...after.filter((e) => !e.inserted),
  ];
  const shuffled = shuffleArray(pool);
  const nextEntries = current
    ? [current, ...pinned, ...shuffled]
    : [...pinned, ...shuffled];

  return {
    entries: nextEntries,
    index: current ? 0 : index,
    unshuffledEntries: entries,
  };
};

export const deckRefs = {
  audio: { current: null as HTMLAudioElement | null },
  paneRefs: {
    sidebar: null,
    tracklist: null,
  } as Record<Pane, RefObject<HTMLElement | null> | null>,
  playNextTrack: { current: (() => {}) as () => void },
};

export const audioRef = {
  get current() {
    return deckRefs.audio.current;
  },
  set current(value: HTMLAudioElement | null) {
    deckRefs.audio.current = value;
  },
} as RefObject<HTMLAudioElement | null>;

const shuffleArray = <T,>(arr: T[]): T[] => {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
};

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
  item.track.id === id
    ? { ...item, track: { ...item.track, ...partial } }
    : item;

export const safePlay = (audio: HTMLAudioElement): void => {
  const promise = audio.play();
  if (promise === undefined) return;
  void promise.catch((err: unknown) => {
    if (err instanceof DOMException && err.name === "AbortError") return;
    console.error("Playback failed:", err);
  });
};

export const isPlayingAtom = atom(false);
export const isShuffledAtom = atom(false);
export const currentTrackAtom = atom<Track | null>(null);
export const currentTimeAtom = atom(0);
export const audioDurationAtom = atom(0);
export const playbackAtom = atom<PlaybackState>(EMPTY_PLAYBACK);
export const activePaneAtom = atom<Pane>("sidebar");

export const userQueueAtom = atom((get) => {
  const playback = get(playbackAtom);
  return playback.entries
    .slice(playback.index + 1)
    .filter((entry) => entry.inserted);
});

export const durationAtom = atom((get) => {
  const currentTrack = get(currentTrackAtom);
  const audioDuration = get(audioDurationAtom);
  if (currentTrack && currentTrack.durationSec > 0) return currentTrack.durationSec;
  if (audioDuration > 0) return Math.round(audioDuration);
  return 0;
});

const playTrackImpl = (set: Setter, track: Track) => {
  set(currentTrackAtom, track);
  set(currentTimeAtom, 0);
  set(audioDurationAtom, 0);
  const audio = deckRefs.audio.current;
  if (audio) {
    audio.src = streamUrlFor(track.storageKey);
    safePlay(audio);
  }
  set(activePaneAtom, "tracklist");
};

export const playTrackAtom = atom(null, (_get, set, track: Track) => {
  playTrackImpl(set, track);
});

export const playFromContextAtom = atom(
  null,
  (get, set, tracks: Track[], index: number) => {
    const track = tracks[index];
    if (!track) return;

    const entries = tracks.map((t) => makeQueueItem(t));

    set(
      playbackAtom,
      get(isShuffledAtom)
        ? shufflePlaybackEntries(entries, index)
        : { entries, index },
    );
    playTrackImpl(set, track);
  },
);

export const togglePlayPauseAtom = atom(null, (get, _set) => {
  const audio = deckRefs.audio.current;
  const currentTrack = get(currentTrackAtom);
  if (!audio || !currentTrack) return;
  if (audio.paused) {
    safePlay(audio);
  } else {
    audio.pause();
  }
});

export const toggleShuffleAtom = atom(null, (get, set) => {
  const playback = get(playbackAtom);
  const { entries, index, unshuffledEntries } = playback;

  if (entries.length === 0 || index < 0) {
    set(isShuffledAtom, !get(isShuffledAtom));
    return;
  }

  if (get(isShuffledAtom)) {
    if (unshuffledEntries?.length) {
      const currentId = entries[index]?.track.id;
      const newIndex = currentId
        ? Math.max(
            0,
            unshuffledEntries.findIndex((e) => e.track.id === currentId),
          )
        : 0;
      set(playbackAtom, { entries: unshuffledEntries, index: newIndex });
    }
    set(isShuffledAtom, false);
    return;
  }

  set(playbackAtom, shufflePlaybackEntries(entries, index));
  set(isShuffledAtom, true);
});

export const playNextTrackAtom = atom(null, (get, set) => {
  const { entries, index } = get(playbackAtom);
  if (index < 0 || index >= entries.length - 1) return;

  const nextIndex = index + 1;
  const next = entries[nextIndex];
  if (!next) return;

  set(
    playbackAtom,
    withPlaybackEntries(get(playbackAtom), entries, nextIndex),
  );
  playTrackImpl(set, next.track);
});

export const playPreviousTrackAtom = atom(null, (get, set) => {
  const playback = get(playbackAtom);
  const { entries, index } = playback;
  if (index <= 0) return;

  const prevIndex = index - 1;
  const prev = entries[prevIndex];
  if (!prev) return;

  set(playbackAtom, withPlaybackEntries(playback, entries, prevIndex));
  playTrackImpl(set, prev.track);
});

export const setCurrentTimeAtom = atom(
  null,
  (_get, set, time: number) => {
    set(currentTimeAtom, time);
  },
);

export const addToUserQueueAtom = atom(
  null,
  (get, set, tracks: Track[]) => {
    if (tracks.length === 0) return;

    const playback = get(playbackAtom);
    const currentTrack = get(currentTrackAtom);
    if (playback.index < 0 || !currentTrack) {
      const [first, ...rest] = tracks;
      if (!first) return;
      const entries = [
        makeQueueItem(first),
        ...rest.map((t) => makeQueueItem(t, true)),
      ];
      set(playbackAtom, { entries, index: 0 });
      playTrackImpl(set, first);
      return;
    }

    let nextEntries = playback.entries;
    let cursor = playback.index;

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

    set(
      playbackAtom,
      withPlaybackEntries(playback, nextEntries, playback.index),
    );
  },
);

export const removeFromUserQueueAtom = atom(
  null,
  (get, set, itemId: string) => {
    const prev = get(playbackAtom);
    const removeIndex = prev.entries.findIndex((e) => e.id === itemId);
    if (removeIndex < 0 || !prev.entries[removeIndex]?.inserted) return;

    const entries = prev.entries.filter((e) => e.id !== itemId);
    const index =
      removeIndex <= prev.index ? Math.max(0, prev.index - 1) : prev.index;
    set(playbackAtom, withPlaybackEntries(prev, entries, index));
  },
);

export const reorderUserQueueAtom = atom(
  null,
  (get, set, activeId: string, overId: string) => {
    const prev = get(playbackAtom);
    const oldIndex = prev.entries.findIndex((e) => e.id === activeId);
    const newIndex = prev.entries.findIndex((e) => e.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const active = prev.entries[oldIndex];
    const over = prev.entries[newIndex];
    if (!active?.inserted || !over?.inserted) return;
    if (oldIndex <= prev.index || newIndex <= prev.index) return;

    const entries = [...prev.entries];
    const [moved] = entries.splice(oldIndex, 1);
    entries.splice(newIndex, 0, moved!);
    set(playbackAtom, { ...prev, entries });
  },
);

export const clearUserQueueAtom = atom(null, (get, set) => {
  const prev = get(playbackAtom);
  set(
    playbackAtom,
    withPlaybackEntries(
      prev,
      prev.entries.filter((entry, i) => i <= prev.index || !entry.inserted),
      prev.index,
    ),
  );
});

export const patchTrackAtom = atom(
  null,
  (_get, set, id: string, partial: Partial<Track>) => {
    set(currentTrackAtom, (t) => (t?.id === id ? { ...t, ...partial } : t));
    set(playbackAtom, (prev) => {
      const patchEntries = (items: QueueItem[]) =>
        items.map((item) => patchQueueItemTrack(item, id, partial));
      return {
        ...prev,
        entries: patchEntries(prev.entries),
        ...(prev.unshuffledEntries !== undefined
          ? { unshuffledEntries: patchEntries(prev.unshuffledEntries) }
          : {}),
      };
    });
  },
);

export const clearPlaybackAtom = atom(null, (_get, set) => {
  set(currentTrackAtom, null);
  set(currentTimeAtom, 0);
  set(audioDurationAtom, 0);
  set(isPlayingAtom, false);
  set(isShuffledAtom, false);
  set(playbackAtom, EMPTY_PLAYBACK);
  const audio = deckRefs.audio.current;
  if (audio) {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }
});

export const setActivePaneAtom = atom(
  null,
  (_get, set, pane: Pane) => {
    set(activePaneAtom, pane);
  },
);

export const registerPaneRef = (
  pane: Pane,
  ref: RefObject<HTMLElement | null>,
) => {
  deckRefs.paneRefs[pane] = ref;
};

export const handlePaneKey = (
  e: React.KeyboardEvent,
  pane: Pane,
  setActivePane: (pane: Pane) => void,
) => {
  if (isTypingTarget(e.target)) return;

  const current = deckRefs.paneRefs[pane];
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
        deckRefs.paneRefs.sidebar?.current
          ?.querySelector<HTMLElement>('[tabindex="0"]')
          ?.focus();
      }
      break;
    }
    case "l": {
      if (pane === "sidebar") {
        e.preventDefault();
        setActivePane("tracklist");
        deckRefs.paneRefs.tracklist?.current
          ?.querySelector<HTMLElement>('[tabindex="0"]')
          ?.focus();
      }
      break;
    }
  }
};

export const resetDeckAtoms = (set: Setter) => {
  set(isPlayingAtom, false);
  set(isShuffledAtom, false);
  set(currentTrackAtom, null);
  set(currentTimeAtom, 0);
  set(audioDurationAtom, 0);
  set(playbackAtom, EMPTY_PLAYBACK);
  set(activePaneAtom, "sidebar");
  deckRefs.audio.current = null;
  deckRefs.paneRefs.sidebar = null;
  deckRefs.paneRefs.tracklist = null;
};
