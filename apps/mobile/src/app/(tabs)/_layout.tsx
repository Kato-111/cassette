import { Tabs } from "expo-router";
import { Heart, House, Library, Search, Settings } from "lucide-react-native";
import { type ColorValue, View } from "react-native";
import { MiniPlayer } from "@/components/mini-player";

const tabIcon = (Icon: typeof House) =>
  function TabIcon({ color, size }: { color: ColorValue; size: number }) {
    return <Icon color={String(color)} size={size} />;
  };

export default function TabLayout() {
  return (
    <View className="flex-1 bg-background">
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: tabIcon(House) }} />
        <Tabs.Screen name="search" options={{ title: "Search", tabBarIcon: tabIcon(Search) }} />
        <Tabs.Screen name="library" options={{ title: "Library", tabBarIcon: tabIcon(Library) }} />
        <Tabs.Screen name="favorites" options={{ title: "Favorites", tabBarIcon: tabIcon(Heart) }} />
        <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: tabIcon(Settings) }} />
      </Tabs>
      <MiniPlayer />
    </View>
  );
}
