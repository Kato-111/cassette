import { Suspense } from "react";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TrackList, TrackListSkeleton } from "@/app/c/[id]/track-list";
import { getAllTracks, searchTracks } from "@/lib/queries";

const Tracks = async ({ query }: { query: string }) => {
  const tracks = query ? await searchTracks(query) : await getAllTracks();
  return <TrackList tracks={tracks} query={query || undefined} />;
};

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) => {
  const { q } = await searchParams;
  const query = q ?? "";

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between bg-background p-3">
        <span className="ml-1 text-sm font-medium">All Tracks</span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            Play all
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Shuffle">
            <IconArrowsShuffle />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden px-4 pb-4">
        <Suspense fallback={<TrackListSkeleton />}>
          <Tracks query={query} />
        </Suspense>
      </div>
    </div>
  );
};

export default Page;
