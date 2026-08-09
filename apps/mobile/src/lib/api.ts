import type { Catalog, Playlist, PlaylistDetail } from "./types";

const DEPLOYED_API_URL = "https://cassetta.vercel.app";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? DEPLOYED_API_URL
).replace(/\/$/, "");

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not configured");
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
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
};

export const api = {
  catalog: () => request<Catalog>("/api/mobile/catalog"),
  playlist: (id: string) =>
    request<PlaylistDetail>(`/api/mobile/playlists/${id}`),
  createPlaylist: (name: string) =>
    request<Playlist>("/api/mobile/playlists", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  renamePlaylist: (id: string, name: string) =>
    request<Playlist>(`/api/mobile/playlists/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    }),
  deletePlaylist: (id: string) =>
    request<void>(`/api/mobile/playlists/${id}`, { method: "DELETE" }),
  addTrack: (playlistId: string, trackId: string) =>
    request<void>(`/api/mobile/playlists/${playlistId}/tracks`, {
      method: "POST",
      body: JSON.stringify({ trackId }),
    }),
  removeTrack: (playlistId: string, trackId: string) =>
    request<void>(`/api/mobile/playlists/${playlistId}/tracks/${trackId}`, {
      method: "DELETE",
    }),
  favorite: (id: string, isFavorite: boolean) =>
    request<{ isFavorite: boolean }>(`/api/mobile/tracks/${id}/favorite`, {
      method: "PATCH",
      body: JSON.stringify({ isFavorite }),
    }),
  streamUrl: (storageKey: string) =>
    `${API_URL}/api/stream/${storageKey
      .split("/")
      .map(encodeURIComponent)
      .join("/")}`,
};
