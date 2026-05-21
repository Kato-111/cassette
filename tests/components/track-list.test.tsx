import { fireEvent, render, screen } from "@testing-library/react";
import type { Track } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { playTrackMock, togglePlayPauseMock, setQueueMock } = vi.hoisted(() => ({
  playTrackMock: vi.fn(),
  togglePlayPauseMock: vi.fn(),
  setQueueMock: vi.fn(),
}));

let deckState = {
  currentTrack: null as Track | null,
  isPlaying: false,
};

vi.mock("@/app/_playback/deck-context", () => ({
  useDeck: () => ({
    currentTrack: deckState.currentTrack,
    isPlaying: deckState.isPlaying,
    playTrack: playTrackMock,
    togglePlayPause: togglePlayPauseMock,
    setQueue: setQueueMock,
    setActivePane: vi.fn(),
    registerPaneRef: vi.fn(),
    handlePaneKey: vi.fn(),
  }),
}));

vi.mock("@/app/_hooks/use-library", () => ({
  useLibrary: () => ({ playlists: [] }),
}));

vi.mock("@/app/_actions/playlists", () => ({
  attachTrackAction: vi.fn(),
  reorderPlaylistTracksAction: vi.fn(),
}));

vi.mock("@/app/_actions/tracks", () => ({
  reorderLibraryTracksAction: vi.fn(),
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

import { TrackList } from "@/app/playlist/[id]/track-list";

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "t1",
  title: "Test Song",
  artist: "Test Artist",
  album: "Test Album",
  durationSec: 200,
  genre: null,
  bpm: null,
  key: null,
  artworkUrl: null,
  storageKey: "audio/test.mp3",
  libraryOrder: 0,
  isLocal: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe("TrackList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deckState = { currentTrack: null, isPlaying: false };
  });

  it("shows empty state", () => {
    render(<TrackList tracks={[]} />);
    expect(screen.getByText("No tracks yet.")).toBeInTheDocument();
  });

  it("clicking row calls playTrack", () => {
    const track = makeTrack();
    const { container } = render(<TrackList tracks={[track]} />);
    const row = container.querySelector(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    fireEvent.click(row!);
    expect(playTrackMock).toHaveBeenCalledWith(track);
  });

  it("clicking current paused row calls togglePlayPause", () => {
    const track = makeTrack();
    deckState = { currentTrack: track, isPlaying: false };
    const { container } = render(<TrackList tracks={[track]} />);
    const row = container.querySelector('[data-state="selected"]');
    fireEvent.click(row!);
    expect(togglePlayPauseMock).toHaveBeenCalled();
    expect(playTrackMock).not.toHaveBeenCalled();
  });
});
