import { router } from "expo-router";
import { Pause, Play, SkipForward } from "lucide-react-native";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Artwork } from "@/components/artwork";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Progress } from "@/components/ui/progress";
import { Text } from "@/components/ui/text";
import { usePlayerState } from "@/contexts/player-context";

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const { currentTrack, playing, currentTime, duration, hasNext, toggle, next } = usePlayerState();

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <Card
      className="absolute left-2 right-2 flex-row items-center gap-1 overflow-hidden p-2"
      style={{ bottom: 52 + insets.bottom }}
    >
      <Button
        variant="ghost"
        className="h-auto min-w-0 flex-1 justify-start p-0"
        accessibilityLabel={`Open Now Playing for ${currentTrack.title}`}
        onPress={() => router.push("/player")}
      >
        <Artwork uri={currentTrack.artworkUrl} size={48} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1}>{currentTrack.title}</Text>
          <Text variant="muted" numberOfLines={1}>{currentTrack.artist}</Text>
          <Progress value={progress} className="mt-2 h-1" />
        </View>
      </Button>
      <Button accessibilityLabel={playing ? "Pause" : "Play"} variant="ghost" size="icon" onPress={toggle}>
        <Icon as={playing ? Pause : Play} />
      </Button>
      <Button accessibilityLabel="Next track" variant="ghost" size="icon" disabled={!hasNext} onPress={next}>
        <Icon as={SkipForward} />
      </Button>
    </Card>
  );
}
