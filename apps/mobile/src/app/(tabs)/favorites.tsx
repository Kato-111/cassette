import { Heart } from "lucide-react-native";
import { CatalogState } from "@/components/catalog-state";
import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { TrackList } from "@/components/track-list";
import { useCatalog } from "@/contexts/catalog-context";

export default function FavoritesScreen() {
  const { catalog, loading, error, refresh } = useCatalog();
  const favorites = catalog.tracks.filter((track) => track.isFavorite);

  return (
    <Screen title="Favorites" description={`${favorites.length} saved tracks`}>
      <CatalogState loading={loading} error={error} onRetry={() => void refresh()}>
        {favorites.length ? (
          <TrackList tracks={favorites} />
        ) : (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Use the heart beside a track to save it here."
          />
        )}
      </CatalogState>
    </Screen>
  );
}
