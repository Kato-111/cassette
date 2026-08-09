import { Image } from "expo-image";
import { Disc3 } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";

type ArtworkProps = {
  uri?: string | null;
  size?: number;
  accessibilityLabel?: string;
};

export function Artwork({ uri, size = 56, accessibilityLabel }: ArtworkProps) {
  const style = { height: size, width: size };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={style}
        contentFit="cover"
        transition={150}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View
      className="items-center justify-center bg-muted"
      style={style}
      accessibilityLabel={accessibilityLabel ?? "No artwork"}
    >
      <Icon as={Disc3} className="text-muted-foreground" />
    </View>
  );
}
