import { FlatList, Text, View } from "react-native";
import { Screen } from "@/components/screen";
import { TrackRow } from "@/components/track-row";
import { useCatalog } from "@/contexts/catalog-context";

export default function FavoritesScreen() {
  const { favorites } = useCatalog();
  return (
    <Screen>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrackRow track={item} context={favorites} />}
        ListHeaderComponent={<View className="px-5 pb-5 pt-4"><Text className="text-[34px] font-bold tracking-[-1.2px] text-white">Favorites</Text><Text className="mt-2 text-sm text-muted">{favorites.length} loved tracks</Text></View>}
        ListEmptyComponent={<Text className="px-5 pt-12 text-center text-muted">Tap the heart on a track to keep it here.</Text>}
        contentContainerStyle={{ paddingBottom: 176 }}
      />
    </Screen>
  );
}
