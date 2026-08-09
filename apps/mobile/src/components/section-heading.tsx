import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export const SectionHeading = ({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) => (
  <View className="mb-4 flex-row items-center justify-between px-5">
    <Text className="text-[21px] font-bold tracking-tight text-white">{title}</Text>
    {onPress ? (
      <Pressable onPress={onPress} className="flex-row items-center gap-1">
        <Text className="text-sm font-medium text-muted">See all</Text>
        <ChevronRight color="#92929d" size={16} />
      </Pressable>
    ) : null}
  </View>
);
