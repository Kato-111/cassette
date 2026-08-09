import "../global.css";
import { ThemeProvider } from "@react-navigation/native";
import { PortalHost } from "@rn-primitives/portal";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CatalogProvider } from "@/contexts/catalog-context";
import { PlayerProvider } from "@/contexts/player-context";
import { NAV_THEME } from "@/lib/theme";

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <ThemeProvider value={NAV_THEME[scheme]}>
          <CatalogProvider>
            <PlayerProvider>
              <StatusBar style={scheme === "dark" ? "light" : "dark"} />
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="album/[id]" options={{ title: "Album" }} />
                <Stack.Screen name="playlist/[id]" options={{ title: "Playlist" }} />
                <Stack.Screen name="player" options={{ title: "Now Playing", presentation: "modal" }} />
              </Stack>
              <PortalHost />
            </PlayerProvider>
          </CatalogProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
