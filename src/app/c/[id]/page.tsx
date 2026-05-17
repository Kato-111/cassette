import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowsShuffle,
} from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CoverTile } from "./cover-tile";
import { TitleField } from "./title-field";
import { TrackList } from "./track-list";
import { getCollectionWithTracks } from "@/lib/queries";
import { formatDuration } from "@/lib/format";

const CollectionPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const collection = await getCollectionWithTracks(id);

  if (!collection) notFound();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between bg-background p-3">
        <div className="flex items-center gap-1">
          <Link href="/">
            <Button variant="ghost" size="icon-sm" aria-label="Back">
              <IconChevronLeft />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled
            aria-label="Forward"
          >
            <IconChevronRight />
          </Button>
          <span className="ml-1 text-sm">{collection.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Play all
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Shuffle">
            <IconArrowsShuffle />
          </Button>
        </div>
      </div>

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

      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <TrackList tracks={collection.tracks} />
      </div>
    </div>
  );
};

export default CollectionPage;
