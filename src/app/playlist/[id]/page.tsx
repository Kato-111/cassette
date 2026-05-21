import { IconArrowsShuffle } from "@tabler/icons-react";
import { notFound } from "next/navigation";
import { SearchField } from "@/app/_components/search-field";
import { LibraryPageHeader } from "@/app/_components/library-page-header";
import { LibraryPageShell } from "@/app/_components/library-page-shell";
import { Button } from "@/components/ui/button";
import { CoverTile } from "./cover-tile";
import { TitleField } from "./title-field";
import { TrackList } from "./track-list";
import { filterTracksByQuery, getPlaylistWithTracks } from "@/lib/queries";
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
  const playlist = await getPlaylistWithTracks(id);

  if (!playlist) notFound();

  const tracks = filterTracksByQuery(playlist.tracks, query);

  return (
    <LibraryPageShell
      header={
        <LibraryPageHeader
          title={
            <span className="truncate text-sm font-medium">
              {playlist.name}
            </span>
          }
          search={
            <SearchField value={query} basePath={`/playlist/${playlist.id}`} />
          }
          actions={
            <Button variant="ghost" size="icon-sm" aria-label="Shuffle">
              <IconArrowsShuffle />
            </Button>
          }
        />
      }
      banner={
        <div className="flex items-center gap-3 bg-background px-4 py-3">
          <CoverTile url={playlist.coverUrl} playlistId={playlist.id} />
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
        reorder={{ type: "playlist", playlistId: playlist.id }}
      />
    </LibraryPageShell>
  );
};

export default PlaylistPage;
