import Constants, { AppOwnership } from "expo-constants";
import { RefreshCw } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useColorScheme } from "nativewind";
import { Screen } from "@/components/screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useCatalog } from "@/contexts/catalog-context";
import { API_URL } from "@/lib/api";

export default function SettingsScreen() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { refreshing, refresh } = useCatalog();
  const supportsNativeMediaSession = Constants.appOwnership !== AppOwnership.Expo;

  return (
    <Screen title="Settings" description="App preferences and connection details">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-32">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Choose how the default component theme follows your device.</CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <View className="flex-row gap-2">
              <Button variant={colorScheme === "light" ? "default" : "outline"} onPress={() => setColorScheme("light")}>
                <Text>Light</Text>
              </Button>
              <Button variant={colorScheme === "dark" ? "default" : "outline"} onPress={() => setColorScheme("dark")}>
                <Text>Dark</Text>
              </Button>
              <Button variant="outline" onPress={() => setColorScheme("system")}>
                <Text>System</Text>
              </Button>
            </View>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Music server</CardTitle>
            <CardDescription numberOfLines={2}>{API_URL}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled={refreshing} onPress={() => void refresh()}>
              <Icon as={RefreshCw} />
              <Text>{refreshing ? "Refreshing…" : "Refresh library"}</Text>
            </Button>
          </CardContent>
        </Card>
        <Text variant="muted" className="text-center">
          {supportsNativeMediaSession
            ? "Background playback uses your device’s native media controls."
            : "Expo Go cannot run the native background playback service. Install a development build to enable it."}
        </Text>
      </ScrollView>
    </Screen>
  );
}
