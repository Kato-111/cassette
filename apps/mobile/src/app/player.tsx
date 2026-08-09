import Slider from "@react-native-community/slider";
import { Disc3, Pause, Play, SkipBack, SkipForward } from "lucide-react-native";
import { useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Artwork } from "@/components/artwork";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { usePlayerState } from "@/contexts/player-context";
import { formatTime } from "@/lib/format";

export default function PlayerScreen() {
  const { width } = useWindowDimensions();
  const artworkSize = Math.min(width - 48, 420);
  const {
    currentTrack,
    playing,
    buffering,
    currentTime,
    duration,
    hasPrevious,
    hasNext,
    toggle,
    previous,
    next,
    seek,
  } = usePlayerState();

  if (!currentTrack) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
        <EmptyState icon={Disc3} title="Nothing playing" description="Choose a track from your library to start playback." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 justify-center gap-6 bg-background p-6" edges={["bottom"]}>
      <View className="items-center">
        <Artwork uri={currentTrack.artworkUrl} size={artworkSize} accessibilityLabel={`${currentTrack.title} artwork`} />
      </View>
      <View className="gap-1">
        <Text variant="h3" numberOfLines={1}>{currentTrack.title}</Text>
        <Text variant="lead" numberOfLines={1}>{currentTrack.artist}</Text>
        {currentTrack.album ? <Text variant="muted" numberOfLines={1}>{currentTrack.album}</Text> : null}
      </View>
      <View>
        <Slider
          accessibilityLabel="Playback position"
          minimumValue={0}
          maximumValue={Math.max(duration, 1)}
          value={Math.min(currentTime, duration || 0)}
          disabled={duration <= 0}
          onSlidingComplete={(value) => void seek(value)}
        />
        <View className="flex-row justify-between">
          <Text variant="muted">{formatTime(currentTime)}</Text>
          <Text variant="muted">{buffering ? "Loading…" : `-${formatTime(Math.max(duration - currentTime, 0))}`}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-center gap-6">
        <Button accessibilityLabel="Previous track" variant="ghost" size="icon" disabled={!hasPrevious} onPress={() => void previous()}>
          <Icon as={SkipBack} size={24} />
        </Button>
        <Button accessibilityLabel={playing ? "Pause" : "Play"} size="icon" onPress={toggle}>
          <Icon as={playing ? Pause : Play} size={24} />
        </Button>
        <Button accessibilityLabel="Next track" variant="ghost" size="icon" disabled={!hasNext} onPress={next}>
          <Icon as={SkipForward} size={24} />
        </Button>
      </View>
    </SafeAreaView>
  );
}
