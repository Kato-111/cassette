import { useLocalSearchParams } from "expo-router";
import { ListMusic, Play } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Artwork } from "@/components/artwork";
import { EmptyState } from "@/components/empty-state";
import { TrackRow } from "@/components/track-row";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Text } from "@/components/ui/text";
import { usePlayerActions } from "@/contexts/player-context";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/format";
import type { PlaylistDetail } from "@/lib/types";

export default function PlaylistScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { playTrack } = usePlayerActions();
  const [playlist, setPlaylist] = useState<PlaylistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      setPlaylist(await api.playlist(params.id));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load playlist");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    const task = setTimeout(() => void load(), 0);
    return () => clearTimeout(task);
  }, [load]);

  const removeTrack = async (trackId: string) => {
    if (!playlist) return;
    await api.removeTrack(playlist.id, trackId);
    setPlaylist((current) => {
      if (!current) return current;
      const tracks = current.tracks.filter((track) => track.id !== trackId);
      return {
        ...current,
        tracks,
        trackCount: tracks.length,
        durationSec: tracks.reduce((total, track) => total + track.durationSec, 0),
      };
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 gap-4 bg-background p-4" edges={["bottom"]}>
        <Skeleton className="mx-auto h-56 w-56" />
        <Skeleton className="mx-auto h-7 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 gap-4 bg-background p-4" edges={["bottom"]}>
        <Alert icon={ListMusic} variant="destructive">
          <AlertTitle>Unable to load playlist</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onPress={() => void load()}><Text>Retry</Text></Button>
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return <EmptyState icon={ListMusic} title="Playlist not found" description="It may have been deleted." />;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["bottom"]}>
      <ScrollView contentContainerClassName="pb-8">
        <View className="items-center gap-3 p-6">
          <Artwork uri={playlist.coverUrl} size={224} accessibilityLabel={`${playlist.name} artwork`} />
          <Text variant="h3" className="text-center">{playlist.name}</Text>
          <Text variant="muted">{playlist.trackCount} tracks · {formatTime(playlist.durationSec)}</Text>
          <Button
            disabled={!playlist.tracks.length}
            onPress={() => playlist.tracks[0] && playTrack(playlist.tracks[0], playlist.tracks)}
          >
            <Icon as={Play} />
            <Text>Play playlist</Text>
          </Button>
        </View>
        {playlist.tracks.length ? playlist.tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            context={playlist.tracks}
            onRemove={() => removeTrack(track.id)}
          />
        )) : (
          <EmptyState icon={ListMusic} title="Empty playlist" description="Add tracks using the action menu beside any track." />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
