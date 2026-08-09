import { Image } from "expo-image";
import { router } from "expo-router";
import { ListMusic, Plus } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Artwork } from "@/components/artwork";
import { Screen } from "@/components/screen";
import { TrackRow } from "@/components/track-row";
import { useCatalog } from "@/contexts/catalog-context";

type Section = "Albums" | "Playlists" | "Songs";

export default function LibraryScreen() {
  const [section, setSection] = useState<Section>("Albums");
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const { albums, playlists, tracks, createPlaylist } = useCatalog();

  const submit = async () => {
    if (!name.trim()) return;
    const playlist = await createPlaylist(name.trim());
    setName("");
    setShowCreate(false);
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 176 }}>
        <View className="flex-row items-center justify-between px-5 pb-4 pt-4">
          <View><Text className="text-[34px] font-bold tracking-[-1.2px] text-white">Library</Text><Text className="mt-1 text-sm text-muted">Your collection, in one place</Text></View>
          <Pressable onPress={() => setShowCreate(true)} className="h-11 w-11 items-center justify-center rounded-full bg-white"><Plus color="#09090b" size={22} /></Pressable>
        </View>
        <View className="mx-5 mb-6 flex-row rounded-2xl bg-surface p-1">
          {(["Albums", "Playlists", "Songs"] as Section[]).map((item) => (
            <Pressable key={item} onPress={() => setSection(item)} className={`flex-1 items-center rounded-xl py-2.5 ${section === item ? "bg-elevated" : ""}`}>
              <Text className={`text-sm font-semibold ${section === item ? "text-white" : "text-muted"}`}>{item}</Text>
            </Pressable>
          ))}
        </View>

        {section === "Albums" ? (
          <View className="flex-row flex-wrap px-3">
            {albums.map((album) => (
              <Pressable key={album.id} onPress={() => router.push(`/album/${album.id}`)} className="w-1/2 px-2 pb-6">
                <Artwork uri={album.coverUrl} size={160} radius={18} />
                <Text numberOfLines={1} className="mt-3 font-semibold text-white">{album.name}</Text>
                <Text numberOfLines={1} className="mt-1 text-xs text-muted">{album.artist}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {section === "Playlists" ? (
          <View className="px-4">
            {playlists.map((playlist) => (
              <Pressable key={playlist.id} onPress={() => router.push(`/playlist/${playlist.id}`)} className="mb-3 flex-row items-center gap-4 rounded-2xl bg-surface p-3">
                {playlist.coverUrl ? <Image source={{ uri: playlist.coverUrl }} style={{ width: 58, height: 58, borderRadius: 14 }} /> : <View className="h-[58px] w-[58px] items-center justify-center rounded-[14px] bg-elevated"><ListMusic color="#92929d" size={24} /></View>}
                <View className="flex-1"><Text className="font-semibold text-white">{playlist.name}</Text><Text className="mt-1 text-xs text-muted">Playlist</Text></View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {section === "Songs" ? <View>{tracks.map((track) => <TrackRow key={track.id} track={track} context={tracks} />)}</View> : null}
      </ScrollView>

      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setShowCreate(false)}>
        <View className="flex-1 justify-end bg-black/70 p-4">
          <View className="rounded-[28px] bg-elevated p-5">
            <Text className="text-xl font-bold text-white">New playlist</Text>
            <TextInput autoFocus value={name} onChangeText={setName} onSubmitEditing={() => void submit()} placeholder="Playlist name" placeholderTextColor="#66666f" className="my-5 h-12 rounded-2xl bg-black/25 px-4 text-base text-white" />
            <View className="flex-row gap-3"><Pressable onPress={() => setShowCreate(false)} className="flex-1 items-center rounded-2xl bg-white/5 py-3.5"><Text className="font-semibold text-white">Cancel</Text></Pressable><Pressable onPress={() => void submit()} className="flex-1 items-center rounded-2xl bg-white py-3.5"><Text className="font-semibold text-black">Create</Text></Pressable></View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
