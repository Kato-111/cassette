import { Suspense } from "react";
import { TrackList } from "@/app/c/[id]/track-list";
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
      <Suspense fallback={<div className="w-full" />}>
        <Tracks query={query} />
      </Suspense>
    </div>
  );
};

export default Page;
