import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Heart, Play, Shuffle } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Artwork } from "@/components/artwork";
import { TrackRow } from "@/components/track-row";
import { useCatalog } from "@/contexts/catalog-context";
import { usePlayer } from "@/contexts/player-context";

export default function AlbumScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { albums, tracks } = useCatalog();
  const { playTrack } = usePlayer();
  const album = albums.find((item) => item.id === id);
  const albumTracks = tracks.filter((track) => track.album === album?.name);
  if (!album) return <View className="flex-1 items-center justify-center bg-canvas"><Text className="text-muted">Album not found</Text></View>;

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <LinearGradient colors={["#282832", "#070709"]} className="items-center px-5 pb-8 pt-14">
          <Pressable onPress={() => router.back()} className="absolute left-5 top-14 h-10 w-10 items-center justify-center rounded-full bg-black/25"><ChevronLeft color="#fff" size={25} /></Pressable>
          <Artwork uri={album.coverUrl} size={260} radius={24} />
          <Text className="mt-7 text-center text-[28px] font-bold tracking-tight text-white">{album.name}</Text>
          <Text className="mt-2 text-sm font-medium text-muted">{album.artist} · {album.trackCount} songs</Text>
          <View className="mt-6 flex-row items-center gap-4">
            <Pressable className="h-12 w-12 items-center justify-center rounded-full bg-white/5"><Heart color="#fff" size={21} /></Pressable>
            <Pressable onPress={() => albumTracks[0] && void playTrack(albumTracks[0], albumTracks)} className="h-14 flex-row items-center gap-2 rounded-full bg-white px-7"><Play color="#050507" fill="#050507" size={21} /><Text className="font-bold text-black">Play</Text></Pressable>
            <Pressable onPress={() => { const shuffled = [...albumTracks].sort(() => Math.random() - 0.5); if (shuffled[0]) void playTrack(shuffled[0], shuffled); }} className="h-12 w-12 items-center justify-center rounded-full bg-white/5"><Shuffle color="#fff" size={21} /></Pressable>
          </View>
        </LinearGradient>
        <View className="pt-2">{albumTracks.map((track) => <TrackRow key={track.id} track={track} context={albumTracks} />)}</View>
      </ScrollView>
    </View>
  );
}
