import { getMinAlbumTracks } from "@/lib/settings";
import { AlbumsSettingsForm } from "./_components/albums-settings-form";

export const dynamic = "force-dynamic";

const SettingsPage = async () => {
  const minAlbumTracks = await getMinAlbumTracks();

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4">
      <AlbumsSettingsForm initialMinTracks={minAlbumTracks} />
    </div>
  );
};

export default SettingsPage;
