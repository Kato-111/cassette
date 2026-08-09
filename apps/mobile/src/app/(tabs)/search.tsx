import { Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { Screen } from "@/components/screen";
import { TrackRow } from "@/components/track-row";
import { useCatalog } from "@/contexts/catalog-context";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { tracks } = useCatalog();
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return tracks.filter((track) =>
      [track.title, track.artist, track.album].some((value) => value?.toLowerCase().includes(needle)),
    );
  }, [query, tracks]);

  return (
    <Screen>
      <View className="px-5 pb-3 pt-4">
        <Text className="mb-5 text-[34px] font-bold tracking-[-1.2px] text-white">Search</Text>
        <View className="h-12 flex-row items-center gap-3 rounded-2xl bg-surface px-4">
          <Search color="#777780" size={20} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Songs, artists, albums"
            placeholderTextColor="#66666f"
            autoCorrect={false}
            className="flex-1 text-base text-white"
          />
          {query ? <Pressable onPress={() => setQuery("")}><X color="#92929d" size={18} /></Pressable> : null}
        </View>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TrackRow track={item} context={results} />}
        contentContainerStyle={{ paddingBottom: 176 }}
        ListEmptyComponent={<Text className="px-5 pt-12 text-center text-muted">{query ? "No matching music" : "Find anything in your collection"}</Text>}
      />
    </Screen>
  );
}
