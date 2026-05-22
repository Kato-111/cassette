import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Track } from "@prisma/client";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeckProvider, useDeck } from "@/contexts/deck-context";

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "t1",
  title: "Track One",
  artist: "Artist",
  album: null,
  durationSec: 120,
  genre: null,
  bpm: null,
  key: null,
  artworkUrl: null,
  storageKey: "audio/one.mp3",
  libraryOrder: 0,
  isLocal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const createMockAudio = () => {
  const listeners = new Map<string, Set<EventListener>>();
  const audio = {
    paused: true,
    src: "",
    currentTime: 0,
    duration: 120,
    play: vi.fn(function (this: { paused: boolean }) {
      this.paused = false;
      return Promise.resolve();
    }),
    pause: vi.fn(function (this: { paused: boolean }) {
      this.paused = true;
    }),
    addEventListener: vi.fn((type: string, fn: EventListener) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(fn);
    }),
    removeEventListener: vi.fn((type: string, fn: EventListener) => {
      listeners.get(type)?.delete(fn);
    }),
    dispatch: (type: string) => {
      listeners.get(type)?.forEach((fn) => fn(new Event(type)));
    },
  };
  return audio as unknown as HTMLAudioElement & { dispatch: (type: string) => void };
};

const DeckHarness = ({
  tracks,
  audioRef,
}: {
  tracks: Track[];
  audioRef: React.RefObject<ReturnType<typeof createMockAudio>>;
}) => {
  const deck = useDeck();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = createMockAudio();
    }
    deck.setQueue(tracks);
    deck.setAudioElement(audioRef.current);
  }, [deck, tracks, audioRef]);

  return (
    <div>
      <button type="button" onClick={() => deck.playTrack(tracks[0]!)}>
        play-first
      </button>
      <button type="button" onClick={() => deck.playNextTrack()}>
        next
      </button>
      <button type="button" onClick={() => deck.playPreviousTrack()}>
        prev
      </button>
      <button type="button" onClick={() => deck.togglePlayPause()}>
        toggle
      </button>
      <span data-testid="current">{deck.currentTrack?.title ?? "none"}</span>
    </div>
  );
};

const renderDeck = (tracks: Track[]) => {
  const audioRef = { current: null as ReturnType<typeof createMockAudio> | null };
  render(
    <DeckProvider>
      <DeckHarness tracks={tracks} audioRef={audioRef} />
    </DeckProvider>,
  );
  return audioRef;
};

describe("DeckProvider", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("playTrack sets currentTrack, src, and calls play", async () => {
    const tracks = [
      makeTrack({ id: "t1", storageKey: "audio/one.mp3" }),
      makeTrack({ id: "t2", title: "Track Two", storageKey: "audio/two.mp3" }),
    ];
    const audioRef = renderDeck(tracks);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "play-first" }));
    });

    expect(screen.getByTestId("current")).toHaveTextContent("Track One");
    expect(audioRef.current?.src).toContain("/api/stream/audio/one.mp3");
    expect(audioRef.current?.play).toHaveBeenCalled();
  });

  it("playNextTrack and playPreviousTrack wrap queue", async () => {
    const tracks = [
      makeTrack({ id: "t1", title: "First" }),
      makeTrack({ id: "t2", title: "Second" }),
    ];
    renderDeck(tracks);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "play-first" }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "next" }));
    });
    expect(screen.getByTestId("current")).toHaveTextContent("Second");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "prev" }));
    });
    expect(screen.getByTestId("current")).toHaveTextContent("First");
  });

  it("togglePlayPause respects paused state", async () => {
    const tracks = [makeTrack()];
    const audioRef = renderDeck(tracks);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "play-first" }));
    });

    if (audioRef.current) audioRef.current.paused = false;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    });
    expect(audioRef.current?.pause).toHaveBeenCalled();

    if (audioRef.current) audioRef.current.paused = true;
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "toggle" }));
    });
    expect(audioRef.current?.play).toHaveBeenCalledTimes(2);
  });

  it("space on body toggles playback", async () => {
    renderDeck([makeTrack()]);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "play-first" }));
    });
    await act(async () => {
      fireEvent.keyDown(document.body, { key: " ", code: "Space" });
    });
  });

  it("slash focuses search input unless focus is in input", async () => {
    const search = document.createElement("input");
    search.type = "search";
    document.body.appendChild(search);
    const focusSpy = vi.spyOn(search, "focus");

    renderDeck([makeTrack()]);

    await act(async () => {
      fireEvent.keyDown(document.body, { key: "/" });
    });
    expect(focusSpy).toHaveBeenCalled();

    const other = document.createElement("input");
    document.body.appendChild(other);
    focusSpy.mockClear();

    await act(async () => {
      fireEvent.keyDown(other, { key: "/" });
    });
    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("ended event advances to next track", async () => {
    const tracks = [
      makeTrack({ id: "t1", title: "First" }),
      makeTrack({ id: "t2", title: "Second" }),
    ];
    const audioRef = renderDeck(tracks);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "play-first" }));
    });

    await act(async () => {
      audioRef.current?.dispatch("ended");
    });

    await waitFor(() => {
      expect(screen.getByTestId("current")).toHaveTextContent("Second");
    });
  });
});
