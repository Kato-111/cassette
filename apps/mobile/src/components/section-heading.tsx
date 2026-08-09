import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <View className="gap-1 px-4 pb-2 pt-4">
      <Text variant="h4">{title}</Text>
      {description ? <Text variant="muted">{description}</Text> : null}
    </View>
  );
}
