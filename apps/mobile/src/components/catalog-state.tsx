import { AlertCircle, RefreshCw } from "lucide-react-native";
import type { ReactNode } from "react";
import { View } from "react-native";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { CatalogSkeleton } from "@/components/catalog-skeleton";

export function CatalogState({
  loading,
  error,
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  children: ReactNode;
}) {
  if (loading) return <CatalogSkeleton />;

  if (error) {
    return (
      <View className="gap-4 p-4">
        <Alert icon={AlertCircle} variant="destructive">
          <AlertTitle>Unable to load your music</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onPress={onRetry}>
          <Icon as={RefreshCw} />
          <Text>Retry</Text>
        </Button>
      </View>
    );
  }

  return children;
}
