import { Bell, ChevronRight, Cloud, Palette } from "lucide-react-native";
import { Text, View } from "react-native";
import { Screen } from "@/components/screen";

const Row = ({ icon: Icon, label, detail }: { icon: typeof Cloud; label: string; detail: string }) => (
  <View className="flex-row items-center gap-4 border-b border-white/5 px-4 py-4">
    <View className="h-9 w-9 items-center justify-center rounded-xl bg-white/5"><Icon color="#b8b8c1" size={19} /></View>
    <View className="flex-1"><Text className="font-semibold text-white">{label}</Text><Text className="mt-1 text-xs text-muted">{detail}</Text></View>
    <ChevronRight color="#55555d" size={18} />
  </View>
);

export default function SettingsScreen() {
  return (
    <Screen>
      <View className="px-5 pb-5 pt-4"><Text className="text-[34px] font-bold tracking-[-1.2px] text-white">Settings</Text><Text className="mt-2 text-sm text-muted">A quiet place for what comes next.</Text></View>
      <View className="mx-4 overflow-hidden rounded-3xl bg-surface">
        <Row icon={Cloud} label="Connection" detail="Connected to your Cassetta server" />
        <Row icon={Palette} label="Appearance" detail="Dark · system controls coming soon" />
        <Row icon={Bell} label="Notifications" detail="Not configured" />
      </View>
      <Text className="mt-8 text-center text-xs font-semibold uppercase tracking-[2px] text-white/25">Cassetta 1.0</Text>
    </Screen>
  );
}
