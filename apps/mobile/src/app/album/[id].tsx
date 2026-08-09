import { useLocalSearchParams } from "expo-router";
import { Play } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Artwork } from "@/components/artwork";
import { CatalogState } from "@/components/catalog-state";
import { EmptyState } from "@/components/empty-state";
import { TrackRow } from "@/components/track-row";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/contexts/catalog-context";
import { usePlayerActions } from "@/contexts/player-context";
import { formatTime } from "@/lib/format";

export default function AlbumScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { catalog, loading, error, refresh } = useCatalog();
  const { playTrack } = usePlayerActions();
  const album = catalog.albums.find((item) => item.id === params.id);
  const tracks = album ? catalog.tracks.filter((track) => track.album === album.name) : [];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <CatalogState loading={loading} error={error} onRetry={() => void refresh()}>
        {album ? (
          <ScrollView contentContainerClassName="pb-8">
            <View className="items-center gap-3 p-6">
              <Artwork uri={album.coverUrl} size={224} accessibilityLabel={`${album.name} artwork`} />
              <Text variant="h3" className="text-center">{album.name}</Text>
              <Text variant="muted" className="text-center">{album.artist}</Text>
              <Text variant="muted">{tracks.length} tracks · {formatTime(album.durationSec)}</Text>
              <Button disabled={!tracks.length} onPress={() => tracks[0] && playTrack(tracks[0], tracks)}>
                <Icon as={Play} />
                <Text>Play album</Text>
              </Button>
            </View>
            {tracks.map((track) => <TrackRow key={track.id} track={track} context={tracks} />)}
          </ScrollView>
        ) : (
          <EmptyState icon={Play} title="Album not found" description="It may have been removed from your library." />
        )}
      </CatalogState>
    </SafeAreaView>
  );
}
