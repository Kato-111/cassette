import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Music2 } from "lucide-react-native";
import { View } from "react-native";

export const Artwork = ({
  uri,
  size,
  radius = 16,
}: {
  uri?: string | null;
  size: number;
  radius?: number;
}) => (
  <View
    style={{ width: size, height: size, borderRadius: radius, overflow: "hidden" }}
    className="bg-elevated"
  >
    {uri ? (
      <Image
        source={{ uri }}
        style={{ width: size, height: size }}
        contentFit="cover"
        transition={220}
      />
    ) : (
      <LinearGradient
        colors={["#25252c", "#111114"]}
        className="flex-1 items-center justify-center"
      >
        <Music2 color="#777780" size={size * 0.32} strokeWidth={1.5} />
      </LinearGradient>
    )}
  </View>
);
