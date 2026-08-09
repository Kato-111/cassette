import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { Pause, Play, SkipForward } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { usePlayer } from "@/contexts/player-context";
import { Artwork } from "./artwork";

export const MiniPlayer = () => {
  const { currentTrack, playing, toggle, next, currentTime, duration } = usePlayer();
  if (!currentTrack) return null;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <Pressable
      onPress={() => router.push("/player")}
      className="absolute bottom-[68px] left-3 right-3 overflow-hidden rounded-[20px] border border-white/10"
    >
      <BlurView intensity={75} tint="dark" className="flex-row items-center gap-3 bg-[#16161acc] p-2.5">
        <Artwork uri={currentTrack.artworkUrl} size={46} radius={11} />
        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-white">{currentTrack.title}</Text>
          <Text numberOfLines={1} className="mt-0.5 text-xs text-muted">{currentTrack.artist}</Text>
        </View>
        <Pressable hitSlop={10} onPress={(event) => { event.stopPropagation(); toggle(); }} className="p-2">
          {playing ? <Pause color="#fff" fill="#fff" size={22} /> : <Play color="#fff" fill="#fff" size={22} />}
        </Pressable>
        <Pressable hitSlop={10} onPress={(event) => { event.stopPropagation(); void next(); }} className="p-2">
          <SkipForward color="#fff" fill="#fff" size={21} />
        </Pressable>
      </BlurView>
      <View className="h-0.5 bg-white/10">
        <View className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
      </View>
    </Pressable>
  );
};
