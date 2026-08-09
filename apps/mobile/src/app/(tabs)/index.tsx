import { Music2, RefreshCw } from "lucide-react-native";
import { RefreshControl, ScrollView, View } from "react-native";
import { CatalogState } from "@/components/catalog-state";
import { CollectionTile } from "@/components/collection-tile";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { SectionHeading } from "@/components/section-heading";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useCatalog } from "@/contexts/catalog-context";

export default function HomeScreen() {
  const { catalog, loading, refreshing, error, refresh } = useCatalog();
  const recentTracks = catalog.tracks.slice(0, 8);

  return (
    <Screen
      title="Cassetta"
      description="Your music"
      action={
        <Button
          accessibilityLabel="Refresh library"
          variant="outline"
          size="icon"
          disabled={loading || refreshing}
          onPress={() => void refresh()}
        >
          <Icon as={RefreshCw} />
        </Button>
      }
    >
      <CatalogState loading={loading} error={error} onRetry={() => void refresh()}>
        {!catalog.tracks.length && !catalog.albums.length ? (
          <EmptyState icon={Music2} title="Your library is empty" description="Add music on the Cassetta server, then refresh this screen." />
        ) : (
          <ScrollView
            contentContainerClassName="pb-32"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />}
          >
            {catalog.albums.length ? (
              <>
                <SectionHeading title="Albums" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-2">
                  {catalog.albums.slice(0, 10).map((album) => (
                    <CollectionTile
                      key={album.id}
                      id={album.id}
                      type="album"
                      title={album.name}
                      subtitle={album.artist}
                      artworkUrl={album.coverUrl}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}
            <SectionHeading title="Recently added" description={`${catalog.tracks.length} tracks in your library`} />
            <View>
              {recentTracks.map((track) => (
                <TrackRow key={track.id} track={track} context={recentTracks} />
              ))}
            </View>
          </ScrollView>
        )}
      </CatalogState>
    </Screen>
  );
}
