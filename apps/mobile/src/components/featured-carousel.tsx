import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Dimensions, Pressable, Text } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import type { Album } from "@/lib/types";

const SCREEN = Dimensions.get("window").width;
const WIDTH = SCREEN - 64;

const Card = ({ album, index, x }: { album: Album; index: number; x: SharedValue<number> }) => {
  const style = useAnimatedStyle(() => {
    const input = [(index - 1) * WIDTH, index * WIDTH, (index + 1) * WIDTH];
    return {
      transform: [
        { scale: interpolate(x.value, input, [0.91, 1, 0.91], Extrapolation.CLAMP) },
        { translateY: interpolate(x.value, input, [10, 0, 10], Extrapolation.CLAMP) },
      ],
      opacity: interpolate(x.value, input, [0.55, 1, 0.55], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View style={[{ width: WIDTH, paddingHorizontal: 6 }, style]}>
      <Pressable
        onPress={() => router.push(`/album/${album.id}`)}
        className="h-[360px] overflow-hidden rounded-[30px] bg-surface"
      >
        {album.coverUrl ? (
          <Image source={{ uri: album.coverUrl }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
        ) : null}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.94)"]}
          locations={[0.35, 0.58, 1]}
          className="absolute inset-0 justify-end p-6"
        >
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-[2px] text-white/60">
            Featured album
          </Text>
          <Text numberOfLines={2} className="text-[27px] font-bold leading-8 tracking-tight text-white">
            {album.name}
          </Text>
          <Text className="mt-2 text-sm font-medium text-white/65">{album.artist}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

// Adapted from Reacticx's copy-owned parallax carousel interaction model.
export const FeaturedCarousel = ({ albums }: { albums: Album[] }) => {
  const x = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    x.value = event.contentOffset.x;
  });

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={WIDTH}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 26 }}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      {albums.slice(0, 8).map((album, index) => (
        <Card key={album.id} album={album} index={index} x={x} />
      ))}
    </Animated.ScrollView>
  );
};
