import { Ellipsis, Heart, ListPlus, Trash2 } from "lucide-react-native";
import { Alert, View } from "react-native";
import { Artwork } from "@/components/artwork";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/contexts/catalog-context";
import { usePlayerActions } from "@/contexts/player-context";
import { api } from "@/lib/api";
import type { Track } from "@/lib/types";

export function TrackRow({
  track,
  context,
  onRemove,
}: {
  track: Track;
  context: Track[];
  onRemove?: () => Promise<void>;
}) {
  const { catalog, setFavorite } = useCatalog();
  const { playTrack } = usePlayerActions();

  const toggleFavorite = async () => {
    try {
      await setFavorite(track, !track.isFavorite);
    } catch (cause) {
      Alert.alert(
        "Could not update favorite",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    try {
      await api.addTrack(playlistId, track.id);
      Alert.alert("Added to playlist");
    } catch (cause) {
      Alert.alert(
        "Could not add track",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    }
  };

  const remove = async () => {
    if (!onRemove) return;
    try {
      await onRemove();
    } catch (cause) {
      Alert.alert(
        "Could not remove track",
        cause instanceof Error ? cause.message : "Please try again.",
      );
    }
  };

  const confirmRemove = () => {
    Alert.alert(
      "Remove from playlist?",
      `${track.title} will remain in your library.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => void remove() },
      ],
    );
  };

  return (
    <View className="flex-row items-center px-2 py-1">
      <Button
        accessibilityLabel={`Play ${track.title} by ${track.artist}`}
        variant="ghost"
        className="h-auto min-w-0 flex-1 justify-start px-2 py-2"
        onPress={() => playTrack(track, context)}
      >
        <Artwork
          uri={track.artworkUrl}
          size={52}
          accessibilityLabel={`${track.title} artwork`}
        />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1}>{track.title}</Text>
          <Text variant="muted" numberOfLines={1}>
            {track.artist}{track.album ? ` · ${track.album}` : ""}
          </Text>
        </View>
      </Button>
      <Button
        accessibilityLabel={track.isFavorite ? "Remove from favorites" : "Add to favorites"}
        variant="ghost"
        size="icon"
        onPress={() => void toggleFavorite()}
      >
        <Icon as={Heart} fill={track.isFavorite ? "currentColor" : "none"} />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button accessibilityLabel={`More actions for ${track.title}`} variant="ghost" size="icon">
            <Icon as={Ellipsis} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-64">
          <DropdownMenuLabel>Add to playlist</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {catalog.playlists.length ? (
            catalog.playlists.map((playlist) => (
              <DropdownMenuItem
                key={playlist.id}
                onPress={() => void addToPlaylist(playlist.id)}
              >
                <Icon as={ListPlus} />
                <Text numberOfLines={1}>{playlist.name}</Text>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled>
              <Text>Create a playlist in Library first</Text>
            </DropdownMenuItem>
          )}
          {onRemove ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onPress={confirmRemove}>
                <Icon as={Trash2} />
                <Text>Remove from this playlist</Text>
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
}
