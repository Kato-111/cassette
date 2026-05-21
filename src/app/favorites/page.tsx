import { Suspense } from "react";
import { TrackList, TrackListSkeleton } from "@/app/playlist/[id]/track-list";
import { getFavoriteTracks, searchFavoriteTracks } from "@/lib/queries";
import { LibraryPageHeader } from "../_components/library-page-header";
import { LibraryPageShell } from "../_components/library-page-shell";
import { SearchField } from "../_components/search-field";

const Tracks = async ({ query }: { query: string }) => {
  const tracks = query
    ? await searchFavoriteTracks(query)
    : await getFavoriteTracks();
  return (
    <TrackList
      key={tracks.map((t) => t.id).join("\0")}
      tracks={tracks}
      query={query || undefined}
      emptyMessage="No favorite tracks yet."
    />
  );
};

const Page = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) => {
  const { q } = await searchParams;
  const query = q ?? "";

  return (
    <LibraryPageShell
      header={
        <LibraryPageHeader
          title={<span className="text-sm font-medium">Favorites</span>}
          search={<SearchField value={query} basePath="/favorites" />}
        />
      }
    >
      <Suspense fallback={<TrackListSkeleton />}>
        <Tracks query={query} />
      </Suspense>
    </LibraryPageShell>
  );
};

export default Page;
