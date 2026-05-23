import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Track } from "@prisma/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const {
  playFromContextMock,
  togglePlayPauseMock,
  addToUserQueueMock,
  clearPlaybackMock,
  refreshMock,
  detachTracksActionMock,
  deleteTracksActionMock,
} = vi.hoisted(() => ({
  playFromContextMock: vi.fn(),
  togglePlayPauseMock: vi.fn(),
  addToUserQueueMock: vi.fn(),
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
    playFromContext: playFromContextMock,
    togglePlayPause: togglePlayPauseMock,
    addToUserQueue: addToUserQueueMock,
    clearPlayback: clearPlaybackMock,
    setActivePane: vi.fn(),
    registerPaneRef: vi.fn(),
    handlePaneKey: vi.fn(),
  }),
}));

vi.mock("@/contexts/library-context", () => ({
  useLibrary: () => ({ playlists: [], albums: [] }),
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
import type { TrackListView } from "@/app/_components/track-list/types";

const renderTrackList = (
  tracks: Track[],
  view: TrackListView,
  options?: { query?: string; emptyMessage?: string },
) =>
  render(
    <div style={{ display: "flex", flexDirection: "column", height: 600 }}>
      <TrackList
        tracks={tracks}
        view={view}
        query={options?.query}
        emptyMessage={options?.emptyMessage}
      />
    </div>,
  );

const makeTrack = (overrides: Partial<Track> = {}): Track => ({
  id: "t1",
  title: "Test Song",
  artist: "Test Artist",
  album: "Test Album",
  durationSec: 200,
  genre: null,
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
    renderTrackList([makeTrack()], { kind: "library" });
    await openOptionsMenu();
    expect(screen.getByText("Remove from library")).toBeInTheDocument();
  });

  it("calls deleteTracksAction when removing from library", async () => {
    const user = userEvent.setup();
    renderTrackList([makeTrack({ id: "t-1" })], { kind: "library" });
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from library"));

    await waitFor(() => {
      expect(deleteTracksActionMock).toHaveBeenCalledWith(["t-1"]);
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("restores tracks and skips playback when removal fails", async () => {
    deleteTracksActionMock.mockResolvedValue({ ok: false, error: "fail" });
    const user = userEvent.setup();
    const track = makeTrack({ id: "t-1", title: "Gone Song" });
    deckState = { currentTrack: track, isPlaying: true };

    renderTrackList([track], { kind: "library" });
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from library"));

    await waitFor(() => {
      expect(deleteTracksActionMock).toHaveBeenCalledWith(["t-1"]);
    });
    expect(screen.getByText("Gone Song")).toBeInTheDocument();
    expect(playFromContextMock).not.toHaveBeenCalled();
    expect(clearPlaybackMock).not.toHaveBeenCalled();
    expect(refreshMock).not.toHaveBeenCalled();
  });

  it("shows empty state", () => {
    renderTrackList([], { kind: "library" });
    expect(screen.getByText("No tracks yet.")).toBeInTheDocument();
  });

  it("clicking row calls playFromContext", () => {
    const track = makeTrack();
    const { container } = renderTrackList([track], { kind: "favorites" });
    const row = container.querySelector(
      '[data-slot="table-body"] [data-slot="table-row"]',
    );
    fireEvent.click(row!);
    expect(playFromContextMock).toHaveBeenCalledWith([track], 0);
  });

  it("clicking current paused row calls togglePlayPause", () => {
    const track = makeTrack();
    deckState = { currentTrack: track, isPlaying: false };
    const { container } = renderTrackList([track], { kind: "favorites" });
    const row = container.querySelector('[data-state="selected"]');
    fireEvent.click(row!);
    expect(togglePlayPauseMock).toHaveBeenCalled();
    expect(playFromContextMock).not.toHaveBeenCalled();
  });

  it("does not show remove options on favorites", async () => {
    renderTrackList([makeTrack()], { kind: "favorites" });
    await openOptionsMenu();
    expect(screen.queryByText("Remove from playlist")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove from library")).not.toBeInTheDocument();
  });

  it("shows remove from this playlist in playlist context", async () => {
    renderTrackList([makeTrack()], { kind: "playlist", playlistId: "pl-1" });
    await openOptionsMenu();
    expect(screen.getByText("Remove from this playlist")).toBeInTheDocument();
    expect(screen.getByText("Remove from library")).toBeInTheDocument();
  });

  it("calls detachTracksAction when removing a single track", async () => {
    const user = userEvent.setup();
    renderTrackList([makeTrack({ id: "t-1" })], {
      kind: "playlist",
      playlistId: "pl-1",
    });
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from this playlist"));

    await waitFor(() => {
      expect(detachTracksActionMock).toHaveBeenCalledWith("pl-1", ["t-1"]);
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("calls deleteTracksAction when removing from library in playlist context", async () => {
    const user = userEvent.setup();
    renderTrackList([makeTrack({ id: "t-1" })], {
      kind: "playlist",
      playlistId: "pl-1",
    });
    await openOptionsMenu();
    await user.click(screen.getByText("Remove from library"));

    await waitFor(() => {
      expect(deleteTracksActionMock).toHaveBeenCalledWith(["t-1"]);
    });
    expect(detachTracksActionMock).not.toHaveBeenCalled();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("selects multiple rows via their checkboxes", async () => {
    const user = userEvent.setup();
    renderTrackList(
      [
        makeTrack({ id: "t-1", title: "Song One" }),
        makeTrack({ id: "t-2", title: "Song Two" }),
        makeTrack({ id: "t-3", title: "Song Three" }),
      ],
      { kind: "playlist", playlistId: "pl-1" },
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

});
