import { router } from "expo-router";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { Screen } from "@/components/screen";
import { SectionHeading } from "@/components/section-heading";
import { TrackRow } from "@/components/track-row";
import { useCatalog } from "@/contexts/catalog-context";
import { greeting } from "@/lib/format";

export default function HomeScreen() {
  const { albums, tracks, loading, refreshing, refresh, error } = useCatalog();
  const recent = [...tracks].slice(-8).reverse();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 176 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} tintColor="#fff" />}
      >
        <View className="px-5 pb-5 pt-4">
          <Text className="text-[13px] font-semibold uppercase tracking-[1.8px] text-muted">Cassetta</Text>
          <Text className="mt-2 text-[34px] font-bold tracking-[-1.2px] text-white">{greeting()}</Text>
        </View>

        {error ? <Text className="mx-5 mb-5 rounded-2xl bg-red-500/10 p-4 text-red-300">{error}</Text> : null}
        {albums.length ? <FeaturedCarousel albums={albums} /> : null}

        <View className="mt-9">
          <SectionHeading title="Recently added" onPress={() => router.push("/(tabs)/library")} />
          {loading ? <Text className="px-5 text-muted">Loading your library…</Text> : recent.map((track) => <TrackRow key={track.id} track={track} context={recent} />)}
        </View>
      </ScrollView>
    </Screen>
  );
}
