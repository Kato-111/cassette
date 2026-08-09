import { Search as SearchIcon } from "lucide-react-native";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { CatalogState } from "@/components/catalog-state";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { TrackList } from "@/components/track-list";
import { Input } from "@/components/ui/input";
import { useCatalog } from "@/contexts/catalog-context";

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const { catalog, loading, error, refresh } = useCatalog();
  const tracks = useMemo(() => {
    const value = query.trim().toLocaleLowerCase();
    if (!value) return [];
    return catalog.tracks.filter((track) =>
      [track.title, track.artist, track.album, track.genre].some((field) =>
        field?.toLocaleLowerCase().includes(value),
      ),
    );
  }, [catalog.tracks, query]);

  return (
    <Screen title="Search" description="Find tracks, artists, albums, and genres">
      <View className="px-4 pb-3">
        <Input
          value={query}
          onChangeText={setQuery}
          placeholder="Search your music"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>
      <CatalogState loading={loading} error={error} onRetry={() => void refresh()}>
        {query.trim() ? (
          <TrackList
            tracks={tracks}
            emptyTitle="No matches"
            emptyDescription={`Nothing matched “${query.trim()}”.`}
          />
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="Search your library"
            description="Enter a track, artist, album, or genre."
          />
        )}
      </CatalogState>
    </Screen>
  );
}
