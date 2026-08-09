import type { ReactElement } from "react";
import { FlatList } from "react-native";
import { Separator } from "@/components/ui/separator";
import { EmptyState } from "@/components/empty-state";
import { Music2 } from "lucide-react-native";
import { TrackRow } from "@/components/track-row";
import type { Track } from "@/lib/types";

export function TrackList({
  tracks,
  ListHeaderComponent,
  emptyTitle = "No tracks found",
  emptyDescription = "Tracks will appear here when they are available.",
}: {
  tracks: Track[];
  ListHeaderComponent?: ReactElement | null;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  return (
    <FlatList
      data={tracks}
      keyExtractor={(track) => track.id}
      keyboardDismissMode="on-drag"
      contentContainerClassName="pb-32"
      ItemSeparatorComponent={Separator}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={({ item }) => <TrackRow track={item} context={tracks} />}
      ListEmptyComponent={
        <EmptyState icon={Music2} title={emptyTitle} description={emptyDescription} />
      }
    />
  );
}
