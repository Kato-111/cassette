import { Disc3, ListMusic, Music2 } from "lucide-react-native";
import { useState } from "react";
import { ScrollView } from "react-native";
import { CatalogState } from "@/components/catalog-state";
import { CollectionTile } from "@/components/collection-tile";
import { CreatePlaylistDialog } from "@/components/create-playlist-dialog";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { TrackList } from "@/components/track-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/contexts/catalog-context";

export default function LibraryScreen() {
  const [tab, setTab] = useState("albums");
  const { catalog, loading, error, refresh } = useCatalog();

  return (
    <Screen title="Library" description="Browse everything you have added" action={<CreatePlaylistDialog />}>
      <CatalogState loading={loading} error={error} onRetry={() => void refresh()}>
        <Tabs value={tab} onValueChange={setTab} className="flex-1 px-4">
          <TabsList>
            <TabsTrigger value="albums"><Text>Albums</Text></TabsTrigger>
            <TabsTrigger value="playlists"><Text>Playlists</Text></TabsTrigger>
            <TabsTrigger value="tracks"><Text>Tracks</Text></TabsTrigger>
          </TabsList>
          <TabsContent value="albums" className="flex-1">
            {catalog.albums.length ? (
              <ScrollView contentContainerClassName="flex-row flex-wrap pb-32">
                {catalog.albums.map((album) => (
                  <CollectionTile
                    key={album.id}
                    id={album.id}
                    type="album"
                    title={album.name}
                    subtitle={`${album.artist} · ${album.trackCount} tracks`}
                    artworkUrl={album.coverUrl}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState icon={Disc3} title="No albums" description="Albums in your catalog will appear here." />
            )}
          </TabsContent>
          <TabsContent value="playlists" className="flex-1">
            {catalog.playlists.length ? (
              <ScrollView contentContainerClassName="flex-row flex-wrap pb-32">
                {catalog.playlists.map((playlist) => (
                  <CollectionTile
                    key={playlist.id}
                    id={playlist.id}
                    type="playlist"
                    title={playlist.name}
                    subtitle="Playlist"
                    artworkUrl={playlist.coverUrl}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState icon={ListMusic} title="No playlists" description="Create a playlist to organize tracks." />
            )}
          </TabsContent>
          <TabsContent value="tracks" className="-mx-4 flex-1">
            {catalog.tracks.length ? (
              <TrackList tracks={catalog.tracks} />
            ) : (
              <EmptyState icon={Music2} title="No tracks" description="Tracks in your catalog will appear here." />
            )}
          </TabsContent>
        </Tabs>
      </CatalogState>
    </Screen>
  );
}
