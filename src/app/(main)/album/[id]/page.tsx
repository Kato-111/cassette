import { notFound } from "next/navigation";
import { SearchField } from "@/app/_components/search-field";
import { LibraryPageHeader } from "@/app/_components/library-page-header";
import { LibraryPageShell } from "@/app/_components/library-page-shell";
import { PlaylistAvatar } from "@/app/_components/playlist-avatar";
import { ShuffleButton } from "@/app/_components/shuffle-button";
import { TrackList } from "@/app/_components/track-list";
import { filterTracksByQuery, getAlbumWithTracks } from "@/lib/queries";
import { formatDuration } from "@/lib/format";

const AlbumPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) => {
  const { id } = await params;
  const { q } = await searchParams;
  const query = q ?? "";
  const album = await getAlbumWithTracks(id);

  if (!album) notFound();

  const tracks = filterTracksByQuery(album.tracks, query);

  return (
    <LibraryPageShell
      header={
        <LibraryPageHeader
          breadcrumb={[
            { label: "Album" },
            { label: album.name },
          ]}
          search={
            <SearchField value={query} basePath={`/album/${album.id}`} />
          }
          actions={<ShuffleButton />}
        />
      }
      banner={
        <div className="flex items-center gap-3 bg-background px-4 py-3">
          <PlaylistAvatar
            name={album.name}
            coverUrl={album.coverUrl}
            className="size-12 rounded-md text-lg"
          />
          <div>
            <h2 className="text-lg font-semibold leading-tight">{album.name}</h2>
            <p className="text-sm text-muted-foreground">{album.artist}</p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {album.trackCount} tracks • {formatDuration(album.durationSec)}
            </p>
          </div>
        </div>
      }
    >
      <TrackList
        key={tracks.map((t) => t.id).join("\0")}
        tracks={tracks}
        query={query || undefined}
        view={{ kind: "album", albumId: album.id }}
      />
    </LibraryPageShell>
  );
};

export default AlbumPage;
