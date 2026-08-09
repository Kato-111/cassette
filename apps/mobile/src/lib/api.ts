import type { Catalog, Playlist, PlaylistDetail } from "./types";

const DEPLOYED_API_URL = "https://cassetta.vercel.app";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? DEPLOYED_API_URL
).replace(/\/$/, "");

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not configured");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...init?.headers,
      },
    });
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      throw new Error(body?.error ?? `Request failed (${response.status})`);
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("The Cassetta server took too long to respond");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const api = {
  catalog: () => request<Catalog>("/api/mobile/catalog"),
  playlist: (id: string) =>
    request<PlaylistDetail>(`/api/mobile/playlists/${encodeURIComponent(id)}`),
  createPlaylist: (name: string) =>
    request<Playlist>("/api/mobile/playlists", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  renamePlaylist: (id: string, name: string) =>
    request<Playlist>(`/api/mobile/playlists/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  deletePlaylist: (id: string) =>
    request<void>(`/api/mobile/playlists/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  addTrack: (playlistId: string, trackId: string) =>
    request<{ ok: true }>(
      `/api/mobile/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
      method: "POST",
      body: JSON.stringify({ trackId }),
      },
    ),
  removeTrack: (playlistId: string, trackId: string) =>
    request<void>(
      `/api/mobile/playlists/${encodeURIComponent(playlistId)}/tracks/${encodeURIComponent(trackId)}`,
      { method: "DELETE" },
    ),
  favorite: (id: string, isFavorite: boolean) =>
    request<{ isFavorite: boolean }>(
      `/api/mobile/tracks/${encodeURIComponent(id)}/favorite`,
      {
        method: "PATCH",
        body: JSON.stringify({ isFavorite }),
      },
    ),
  streamUrl: (storageKey: string) =>
    `${API_URL}/api/stream/${storageKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
};
