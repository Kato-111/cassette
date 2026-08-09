import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, ListMusic, Play } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { TrackRow } from "@/components/track-row";
import { usePlayer } from "@/contexts/player-context";
import { api } from "@/lib/api";
import type { PlaylistDetail } from "@/lib/types";

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const { playTrack } = usePlayer();
  useEffect(() => { if (id) void api.playlist(id).then(setPlaylist); }, [id]);
  if (!playlist) return <View className="flex-1 items-center justify-center bg-canvas"><Text className="text-muted">Loading playlist…</Text></View>;

  return (
    <View className="flex-1 bg-canvas">
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pb-8 pt-14">
          <Pressable onPress={() => router.back()} className="mb-8 h-10 w-10 items-center justify-center rounded-full bg-white/5"><ChevronLeft color="#fff" size={25} /></Pressable>
          <View className="h-44 w-44 items-center justify-center self-center rounded-[28px] bg-elevated"><ListMusic color="#92929d" size={58} strokeWidth={1.3} /></View>
          <Text className="mt-7 text-[30px] font-bold tracking-tight text-white">{playlist.name}</Text>
          <View className="mt-2 flex-row items-center justify-between"><Text className="text-sm text-muted">{playlist.trackCount} songs</Text><Pressable disabled={!playlist.tracks.length} onPress={() => playlist.tracks[0] && void playTrack(playlist.tracks[0], playlist.tracks)} className="h-14 w-14 items-center justify-center rounded-full bg-white"><Play color="#050507" fill="#050507" size={24} /></Pressable></View>
        </View>
        {playlist.tracks.map((track) => <TrackRow key={track.id} track={track} context={playlist.tracks} />)}
        {!playlist.tracks.length ? <Text className="px-5 pt-8 text-center text-muted">This playlist is waiting for its first track.</Text> : null}
      </ScrollView>
    </View>
  );
}
