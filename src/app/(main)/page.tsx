import { Suspense } from "react";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { TrackList, TrackListSkeleton } from "@/app/_components/track-list";
import { getAllTracks, searchTracks } from "@/lib/queries";
import { AddToLibraryDrawer } from "@/app/_components/add-to-library-drawer";
import { LibraryPageHeader } from "@/app/_components/library-page-header";
import { LibraryPageShell } from "@/app/_components/library-page-shell";
import { SearchField } from "@/app/_components/search-field";

const Tracks = async ({ query }: { query: string }) => {
  const tracks = query ? await searchTracks(query) : await getAllTracks();
  return (
    <TrackList
      key={tracks.map((t) => t.id).join("\0")}
      tracks={tracks}
      query={query || undefined}
      view={{ kind: "library" }}
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
          breadcrumb={[{ label: "All Tracks" }]}
          search={<SearchField value={query} basePath="/" />}
          actions={
            <>
              <AddToLibraryDrawer />
              <Button variant="ghost" size="icon-sm" aria-label="Shuffle">
                <IconArrowsShuffle />
              </Button>
            </>
          }
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
