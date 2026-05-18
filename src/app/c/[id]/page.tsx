import { IconArrowsShuffle } from "@tabler/icons-react";
import { notFound } from "next/navigation";
import { SearchField } from "@/app/_components/search-field";
import { LibraryPageHeader } from "@/app/_components/library-page-header";
import { LibraryPageShell } from "@/app/_components/library-page-shell";
import { Button } from "@/components/ui/button";
import { CoverTile } from "./cover-tile";
import { TitleField } from "./title-field";
import { TrackList } from "./track-list";
import { filterTracksByQuery, getCollectionWithTracks } from "@/lib/queries";
import { formatDuration } from "@/lib/format";

const CollectionPage = async ({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) => {
  const { id } = await params;
  const { q } = await searchParams;
  const query = q ?? "";
  const collection = await getCollectionWithTracks(id);

  if (!collection) notFound();

  const tracks = filterTracksByQuery(collection.tracks, query);

  return (
    <LibraryPageShell
      header={
        <LibraryPageHeader
          title={
            <span className="truncate text-sm font-medium">
              {collection.name}
            </span>
          }
          search={
            <SearchField value={query} basePath={`/c/${collection.id}`} />
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
          <CoverTile url={collection.coverUrl} collectionId={collection.id} />
          <div>
            <TitleField
              collectionId={collection.id}
              initialName={collection.name}
            />
            <p className="text-xs text-muted-foreground sm:text-sm">
              {collection.trackCount} tracks •{" "}
              {formatDuration(collection.durationSec)}
            </p>
          </div>
        </div>
      }
    >
      <TrackList tracks={tracks} query={query || undefined} />
    </LibraryPageShell>
  );
};

export default CollectionPage;
