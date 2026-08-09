import { View } from "react-native";
import { Skeleton } from "@/components/ui/skeleton";

export function CatalogSkeleton() {
  return (
    <View className="gap-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} className="gap-2 py-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </View>
      ))}
    </View>
  );
}
