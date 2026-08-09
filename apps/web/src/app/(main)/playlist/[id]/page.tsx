import { notFound } from "next/navigation";
import { AddTracksToPlaylistDrawer } from "@/app/_components/add-tracks-to-playlist-drawer";
import { SearchField } from "@/app/_components/search-field";
import { LibraryPageHeader } from "@/app/_components/library-page-header";
import { LibraryPageShell } from "@/app/_components/library-page-shell";
import { ShuffleButton } from "@/app/_components/shuffle-button";
import { CoverTile } from "./cover-tile";
import { TitleField } from "./title-field";
import { TrackList } from "@/app/_components/track-list";
import {
  filterTracksByQuery,
  getAllTracks,
  getPlaylistWithTracks,
} from "@/lib/queries";
import { formatDuration } from "@/lib/format";

const PlaylistPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) => {
  const { id } = await params;
  const { q } = await searchParams;
  const query = q ?? "";
  const [playlist, libraryTracks] = await Promise.all([
    getPlaylistWithTracks(id),
    getAllTracks(),
  ]);

  if (!playlist) notFound();

  const tracks = filterTracksByQuery(playlist.tracks, query);
  const existingTrackIds = new Set(playlist.tracks.map((t) => t.id));

  return (
    <LibraryPageShell
      header={
        <LibraryPageHeader
          breadcrumb={[
            { label: "Playlist" },
            { label: playlist.name },
          ]}
          search={
            <SearchField value={query} basePath={`/playlist/${playlist.id}`} />
          }
          actions={
            <>
              <AddTracksToPlaylistDrawer
                playlistId={playlist.id}
                libraryTracks={libraryTracks}
                existingTrackIds={existingTrackIds}
              />
              <ShuffleButton />
            </>
          }
        />
      }
      banner={
        <div className="flex items-center gap-3 bg-background px-4 py-3">
          <CoverTile
            url={playlist.coverUrl}
            name={playlist.name}
            playlistId={playlist.id}
          />
          <div>
            <TitleField playlistId={playlist.id} initialName={playlist.name} />
            <p className="text-xs text-muted-foreground sm:text-sm">
              {playlist.trackCount} tracks •{" "}
              {formatDuration(playlist.durationSec)}
            </p>
          </div>
        </div>
      }
    >
      <TrackList
        key={tracks.map((t) => t.id).join("\0")}
        tracks={tracks}
        query={query || undefined}
        view={{ kind: "playlist", playlistId: playlist.id }}
      />
    </LibraryPageShell>
  );
};

export default PlaylistPage;
