import { router } from "expo-router";
import { View } from "react-native";
import { Artwork } from "@/components/artwork";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

type CollectionTileProps = {
  id: string;
  type: "album" | "playlist";
  title: string;
  subtitle: string;
  artworkUrl?: string | null;
};

export function CollectionTile({ id, type, title, subtitle, artworkUrl }: CollectionTileProps) {
  return (
    <Button
      variant="ghost"
      className="h-auto w-40 flex-col items-start px-2 py-2"
      onPress={() =>
        router.push({
          pathname: type === "album" ? "/album/[id]" : "/playlist/[id]",
          params: { id },
        })
      }
      accessibilityLabel={`Open ${type} ${title}`}
    >
      <Artwork uri={artworkUrl} size={144} accessibilityLabel={`${title} artwork`} />
      <View className="w-full gap-1">
        <Text numberOfLines={1}>{title}</Text>
        <Text variant="muted" numberOfLines={1}>{subtitle}</Text>
      </View>
    </Button>
  );
}
