import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 p-8">
      <Icon as={icon} className="text-muted-foreground" size={32} />
      <Text variant="large" className="text-center">
        {title}
      </Text>
      <Text variant="muted" className="text-center">
        {description}
      </Text>
    </View>
  );
}
