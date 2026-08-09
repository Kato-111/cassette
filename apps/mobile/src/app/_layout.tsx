import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CatalogProvider } from "@/contexts/catalog-context";
import { PlayerProvider } from "@/contexts/player-context";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#070709" }}>
      <SafeAreaProvider>
        <CatalogProvider>
          <PlayerProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#070709" } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="album/[id]" />
              <Stack.Screen name="playlist/[id]" />
              <Stack.Screen name="player" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
            </Stack>
          </PlayerProvider>
        </CatalogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
