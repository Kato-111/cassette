import { getMinAlbumTracks } from "@/lib/settings";
import { AlbumsSettingsForm } from "../_components/albums-settings-form";
import { SettingsContent } from "../_components/settings-content";

export const dynamic = "force-dynamic";

const AlbumsSettingsPage = async () => {
  const minAlbumTracks = await getMinAlbumTracks();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
      <SettingsContent title="Albums" className="gap-6">
        <AlbumsSettingsForm initialMinTracks={minAlbumTracks} />
      </SettingsContent>
    </div>
  );
};

export default AlbumsSettingsPage;
