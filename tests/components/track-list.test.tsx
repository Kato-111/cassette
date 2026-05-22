import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Track } from "@prisma/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const {
  playTrackMock,
  togglePlayPauseMock,
  setQueueMock,
  clearPlaybackMock,
  refreshMock,
  detachTracksActionMock,
  deleteTracksActionMock,
} = vi.hoisted(() => ({
  playTrackMock: vi.fn(),
  togglePlayPauseMock: vi.fn(),
  setQueueMock: vi.fn(),
  clearPlaybackMock: vi.fn(),
  refreshMock: vi.fn(),
  detachTracksActionMock: vi.fn().mockResolvedValue({ ok: true }),
  deleteTracksActionMock: vi.fn().mockResolvedValue({ ok: true }),
}));

let deckState = {
  currentTrack: null as Track | null,
  isPlaying: false,
};

vi.mock("@/contexts/deck-context", () => ({
  useDeck: () => ({
    currentTrack: deckState.currentTrack,
    isPlaying: deckState.isPlaying,
    playTrack: playTrackMock,
    togglePlayPause: togglePlayPauseMock,
    setQueue: setQueueMock,
    clearPlayback: clearPlaybackMock,
    setActivePane: vi.fn(),
    registerPaneRef: vi.fn(),
    handlePaneKey: vi.fn(),
  }),
}));

vi.mock("@/contexts/library-context", () => ({
  useLibrary: () => ({ playlists: [] }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/_actions/playlists", () => ({
  attachTrackAction: vi.fn(),
  reorderPlaylistTracksAction: vi.fn(),
  detachTracksAction: detachTracksActionMock,
}));

vi.mock("@/app/_actions/tracks", () => ({
  reorderLibraryTracksAction: vi.fn(),
  deleteTracksAction: deleteTracksActionMock,
}));

vi.mock("next/image", () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

import { TrackList } from "@/app/_components/track-list";

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
  isFavorite: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const openOptionsMenu = async (index = 0) => {
  const user = userEvent.setup();
  const buttons = screen.getAllByRole("button", { name: "Track options" });
  await user.click(buttons[index]!);
};

describe("TrackList", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    deckState = { currentTrack: null, isPlaying: false };
    detachTracksActionMock.mockResolvedValue({ ok: true });
    deleteTracksActionMock.mockResolvedValue({ ok: true });
  });

  it("shows remove from library on all tracks", async () => {
    render(
      <TrackList
        tracks={[makeTrack()]}
        view={{ kind: "library" }}
      />,
    );
    await openOptionsMenu();
    expect(screen.getByText("Remove from library")).toBeInTheDocument();
  });

  it("calls deleteTracksAction when removing from library", async () => {
    const user = userEvent.setup();
    render(
      <TrackList
        tracks={[makeTrack({ id: "t-1" })]}
        view={{ kind: "library" }}
      />,
    );
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from library"));

    await waitFor(() => {
      expect(deleteTracksActionMock).toHaveBeenCalledWith(["t-1"]);
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("calls deleteTracksAction when removing an album from library", async () => {
    const user = userEvent.setup();
    render(
      <TrackList
        tracks={[
          makeTrack({ id: "t-1", album: "Shared Album" }),
          makeTrack({ id: "t-2", album: "Shared Album", title: "Other Song" }),
        ]}
        view={{ kind: "library" }}
      />,
    );
    await openOptionsMenu();
    await user.click(screen.getByText('Remove "Shared Album" from library'));

    await waitFor(() => {
      expect(deleteTracksActionMock).toHaveBeenCalledWith(["t-1", "t-2"]);
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("restores tracks and skips playback when removal fails", async () => {
    deleteTracksActionMock.mockResolvedValue({ ok: false, error: "fail" });
    const user = userEvent.setup();
    const track = makeTrack({ id: "t-1", title: "Gone Song" });
    deckState = { currentTrack: track, isPlaying: true };

    render(
      <TrackList tracks={[track]} view={{ kind: "library" }} />,
    );
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from library"));

    await waitFor(() => {
      expect(deleteTracksActionMock).toHaveBeenCalledWith(["t-1"]);
    });
    expect(screen.getByText("Gone Song")).toBeInTheDocument();
    expect(playTrackMock).not.toHaveBeenCalled();
    expect(clearPlaybackMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows empty state", () => {
    render(<TrackList tracks={[]} view={{ kind: "library" }} />);
    expect(screen.getByText("No tracks yet.")).toBeInTheDocument();
  });

  it("clicking row calls playTrack", () => {
    const track = makeTrack();
    const { container } = render(
      <TrackList tracks={[track]} view={{ kind: "favorites" }} />,
    );
    const row = container.querySelector(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    fireEvent.click(row!);
    expect(playTrackMock).toHaveBeenCalledWith(track);
  });

  it("clicking current paused row calls togglePlayPause", () => {
    const track = makeTrack();
    deckState = { currentTrack: track, isPlaying: false };
    const { container } = render(
      <TrackList tracks={[track]} view={{ kind: "favorites" }} />,
    );
    const row = container.querySelector('[data-state="selected"]');
    fireEvent.click(row!);
    expect(togglePlayPauseMock).toHaveBeenCalled();
    expect(playTrackMock).not.toHaveBeenCalled();
  });

  it("does not show remove options on favorites", async () => {
    render(
      <TrackList tracks={[makeTrack()]} view={{ kind: "favorites" }} />,
    );
    await openOptionsMenu();
    expect(screen.queryByText("Remove from playlist")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove from library")).not.toBeInTheDocument();
  });

  it("shows remove from playlist in playlist context", async () => {
    render(
      <TrackList
        tracks={[makeTrack()]}
        view={{ kind: "playlist", playlistId: "pl-1" }}
      />,
    );
    await openOptionsMenu();
    expect(screen.getByText("Remove from playlist")).toBeInTheDocument();
  });

  it("calls detachTracksAction when removing a single track", async () => {
    const user = userEvent.setup();
    render(
      <TrackList
        tracks={[makeTrack({ id: "t-1" })]}
        view={{ kind: "playlist", playlistId: "pl-1" }}
      />,
    );
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from playlist"));

    await waitFor(() => {
      expect(detachTracksActionMock).toHaveBeenCalledWith("pl-1", ["t-1"]);
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows album remove when album is set", async () => {
    render(
      <TrackList
        tracks={[makeTrack({ album: "Shared Album" })]}
        view={{ kind: "playlist", playlistId: "pl-1" }}
      />,
    );
    await openOptionsMenu();
    expect(
      screen.getByText('Remove "Shared Album" from playlist'),
    ).toBeInTheDocument();
  });

  it("hides album remove when album is null", async () => {
    render(
      <TrackList
        tracks={[makeTrack({ album: null })]}
        view={{ kind: "playlist", playlistId: "pl-1" }}
      />,
    );
    await openOptionsMenu();
    expect(screen.queryByText(/Remove ".*" from playlist/)).not.toBeInTheDocument();
  });

  it("selects multiple rows via their checkboxes", async () => {
    const user = userEvent.setup();
    render(
      <TrackList
        tracks={[
          makeTrack({ id: "t-1", title: "Song One" }),
          makeTrack({ id: "t-2", title: "Song Two" }),
          makeTrack({ id: "t-3", title: "Song Three" }),
        ]}
        view={{ kind: "playlist", playlistId: "pl-1" }}
      />,
    );

    const cbA = screen.getByRole("checkbox", { name: "Select Song One" });
    await user.click(cbA);
    expect(cbA).toHaveAttribute("data-checked");

    const cbB = screen.getByRole("checkbox", { name: "Select Song Two" });
    await user.click(cbB);
    expect(cbA).toHaveAttribute("data-checked");
    expect(cbB).toHaveAttribute("data-checked");

    const cbC = screen.getByRole("checkbox", { name: "Select Song Three" });
    await user.click(cbC);
    expect(cbA).toHaveAttribute("data-checked");
    expect(cbB).toHaveAttribute("data-checked");
    expect(cbC).toHaveAttribute("data-checked");
  });

  it("calls detachTracksAction when removing an album", async () => {
    const user = userEvent.setup();
    render(
      <TrackList
        tracks={[
          makeTrack({ id: "t-1", album: "Shared Album" }),
          makeTrack({ id: "t-2", album: "Shared Album", title: "Other Song" }),
          makeTrack({ id: "t-3", album: "Other Album", title: "Different" }),
        ]}
        view={{ kind: "playlist", playlistId: "pl-1" }}
      />,
    );
    await openOptionsMenu();
    await user.click(screen.getByText('Remove "Shared Album" from playlist'));

    await waitFor(() => {
      expect(detachTracksActionMock).toHaveBeenCalledWith("pl-1", [
        "t-1",
        "t-2",
      ]);
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
