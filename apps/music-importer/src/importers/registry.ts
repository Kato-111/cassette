import type { ImportProvider } from "./types.ts";
import { youtubeProvider } from "./youtube.ts";
import { spotifyProvider } from "./spotify.ts";

const providers: ImportProvider[] = [youtubeProvider, spotifyProvider];

export const resolveProvider = (url: string): ImportProvider => {
  const provider = providers.find((p) => p.canHandle(url));
  if (!provider) {
    throw new Error("Unsupported import URL. Supported: YouTube, Spotify.");
  }
  return provider;
};

export const listProviders = (): ImportProvider[] => providers;
