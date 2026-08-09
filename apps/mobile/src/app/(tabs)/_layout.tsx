import { Tabs } from "expo-router";
import { Heart, House, Library, Search, Settings } from "lucide-react-native";
import { View } from "react-native";
import { MiniPlayer } from "@/components/mini-player";

const icon = (Icon: typeof House) =>
  function TabIcon({ color, focused }: { color: unknown; focused: boolean }) {
    const tint = String(color);
    return <Icon color={tint} fill={focused && Icon === Heart ? tint : "transparent"} size={22} strokeWidth={focused ? 2.4 : 1.8} />;
  };

export default function TabLayout() {
  return (
    <View className="flex-1 bg-canvas">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#66666f",
          tabBarStyle: {
            position: "absolute",
            height: 72,
            paddingTop: 8,
            paddingBottom: 10,
            backgroundColor: "rgba(10,10,12,0.98)",
            borderTopColor: "rgba(255,255,255,0.07)",
          },
          tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon(House) }} />
        <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: icon(Search) }} />
        <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: icon(Library) }} />
        <Tabs.Screen name="favorites" options={{ title: "Favorites", tabBarIcon: icon(Heart) }} />
        <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: icon(Settings) }} />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
