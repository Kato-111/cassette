import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronDown, Heart, ListMusic, MoreHorizontal, Pause, Play, Repeat2, Shuffle, SkipBack, SkipForward } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Artwork } from "@/components/artwork";
import { useCatalog } from "@/contexts/catalog-context";
import { usePlayer } from "@/contexts/player-context";
import { formatTime } from "@/lib/format";

export default function PlayerScreen() {
  const { currentTrack, playing, toggle, next, previous, currentTime, duration, seek } = usePlayer();
  const { setFavorite } = useCatalog();
  if (!currentTrack) return null;
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <LinearGradient colors={["#282832", "#09090b", "#070709"]} locations={[0, 0.58, 1]} className="flex-1 px-6 pb-10 pt-12">
      <View className="mb-7 flex-row items-center justify-between"><Pressable onPress={() => router.back()} className="p-2"><ChevronDown color="#fff" size={27} /></Pressable><Text className="text-[11px] font-bold uppercase tracking-[2px] text-white/55">Now playing</Text><Pressable className="p-2"><MoreHorizontal color="#fff" size={25} /></Pressable></View>
      <View className="items-center"><Artwork uri={currentTrack.artworkUrl} size={330} radius={30} /></View>
      <View className="mt-9 flex-row items-center"><View className="min-w-0 flex-1"><Text numberOfLines={1} className="text-[23px] font-bold tracking-tight text-white">{currentTrack.title}</Text><Text numberOfLines={1} className="mt-1.5 text-base font-medium text-white/50">{currentTrack.artist}</Text></View><Pressable onPress={() => void setFavorite(currentTrack, !currentTrack.isFavorite)} className="p-3"><Heart color={currentTrack.isFavorite ? "#ff375f" : "#fff"} fill={currentTrack.isFavorite ? "#ff375f" : "transparent"} size={24} /></Pressable></View>
      <Pressable onPress={(event) => { const x = event.nativeEvent.locationX; void seek((x / 330) * duration); }} className="mt-8 h-5 justify-center"><View className="h-1 overflow-hidden rounded-full bg-white/15"><View className="h-full rounded-full bg-white" style={{ width: `${progress * 100}%` }} /></View></Pressable>
      <View className="mt-1 flex-row justify-between"><Text className="text-[11px] text-white/40">{formatTime(currentTime)}</Text><Text className="text-[11px] text-white/40">-{formatTime(Math.max(duration - currentTime, 0))}</Text></View>
      <View className="mt-8 flex-row items-center justify-between px-2"><Pressable className="p-3"><Shuffle color="#777780" size={21} /></Pressable><Pressable onPress={() => void previous()} className="p-3"><SkipBack color="#fff" fill="#fff" size={32} /></Pressable><Pressable onPress={toggle} className="h-[76px] w-[76px] items-center justify-center rounded-full bg-white">{playing ? <Pause color="#050507" fill="#050507" size={34} /> : <Play color="#050507" fill="#050507" size={34} />}</Pressable><Pressable onPress={() => void next()} className="p-3"><SkipForward color="#fff" fill="#fff" size={32} /></Pressable><Pressable className="p-3"><Repeat2 color="#777780" size={22} /></Pressable></View>
      <View className="mt-auto flex-row justify-center gap-16"><Pressable className="items-center gap-2"><ListMusic color="#777780" size={21} /><Text className="text-[10px] font-semibold text-muted">Queue</Text></Pressable></View>
    </LinearGradient>
  );
}
