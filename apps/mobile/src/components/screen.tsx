import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";

type ScreenProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Screen({ title, description, action, children }: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <View className="gap-1 px-4 pb-3 pt-2">
        <View className="flex-row items-center justify-between gap-4">
          <Text variant="h3">{title}</Text>
          {action}
        </View>
        {description ? <Text variant="muted">{description}</Text> : null}
      </View>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  );
}
