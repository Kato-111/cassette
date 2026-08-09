import type { DownloadedAudio, ImportItem, ImportProvider } from "./types.ts";
import {
  downloadSpotifyTrack,
  saveSpotifyUrl,
} from "./spotdl-runner.ts";

export const spotifyProvider: ImportProvider = {
  source: "spotify",

  canHandle(url: string): boolean {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, "");
      return host === "open.spotify.com" || host === "spotify.com";
    } catch {
      return false;
    }
  },

  async listItems(url: string): Promise<ImportItem[]> {
    const items = await saveSpotifyUrl(url);
    if (items.length === 0) {
      throw new Error("No tracks found for Spotify URL");
    }
    return items;
  },

  async downloadItem(item: ImportItem, destDir: string): Promise<DownloadedAudio> {
    return downloadSpotifyTrack(item, destDir);
  },
};
