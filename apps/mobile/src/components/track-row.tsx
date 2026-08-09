import * as Haptics from "expo-haptics";
import { Ellipsis, Heart, Play } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useCatalog } from "@/contexts/catalog-context";
import { usePlayer } from "@/contexts/player-context";
import { api } from "@/lib/api";
import type { Track } from "@/lib/types";
import { Artwork } from "./artwork";

export const TrackRow = ({ track, context }: { track: Track; context?: Track[] }) => {
  const { currentTrack, playTrack } = usePlayer();
  const { setFavorite, playlists } = useCatalog();
  const [showActions, setShowActions] = useState(false);
  const active = currentTrack?.id === track.id;

  return <>
    <Pressable
      onPress={() => void playTrack(track, context)}
      className="mx-4 flex-row items-center gap-3 rounded-2xl px-2 py-2 active:bg-white/5"
    >
      <View>
        <Artwork uri={track.artworkUrl} size={52} radius={12} />
        {active ? (
          <View className="absolute inset-0 items-center justify-center rounded-xl bg-black/45">
            <Play color="#fff" fill="#fff" size={18} />
          </View>
        ) : null}
      </View>
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className={active ? "font-semibold text-accent" : "font-semibold text-white"}>
          {track.title}
        </Text>
        <Text numberOfLines={1} className="mt-1 text-[13px] text-muted">
          {track.artist}{track.album ? ` · ${track.album}` : ""}
        </Text>
      </View>
      <Pressable
        hitSlop={10}
        onPress={() => {
          void Haptics.selectionAsync();
          void setFavorite(track, !track.isFavorite);
        }}
        className="p-2"
      >
        <Heart
          color={track.isFavorite ? "#ff375f" : "#777780"}
          fill={track.isFavorite ? "#ff375f" : "transparent"}
          size={19}
        />
      </Pressable>
      <Pressable hitSlop={10} onPress={() => setShowActions(true)} className="p-1">
        <Ellipsis color="#777780" size={20} />
      </Pressable>
    </Pressable>
    <Modal visible={showActions} transparent animationType="fade" onRequestClose={() => setShowActions(false)}>
      <Pressable onPress={() => setShowActions(false)} className="flex-1 justify-end bg-black/70 p-4">
        <Pressable className="rounded-[28px] bg-elevated p-5">
          <View className="mb-5 flex-row items-center gap-3"><Artwork uri={track.artworkUrl} size={48} radius={12} /><View className="flex-1"><Text numberOfLines={1} className="font-semibold text-white">{track.title}</Text><Text numberOfLines={1} className="mt-1 text-xs text-muted">{track.artist}</Text></View></View>
          <Text className="mb-3 text-xs font-bold uppercase tracking-[1.5px] text-white/35">Add to playlist</Text>
          {playlists.map((playlist) => (
            <Pressable key={playlist.id} onPress={() => { void api.addTrack(playlist.id, track.id).then(() => { void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowActions(false); }); }} className="border-b border-white/5 py-4">
              <Text className="font-semibold text-white">{playlist.name}</Text>
            </Pressable>
          ))}
          {!playlists.length ? <Text className="py-4 text-muted">Create a playlist from Library first.</Text> : null}
        </Pressable>
      </Pressable>
    </Modal>
  </>;
};
