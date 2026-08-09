export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  durationSec: number;
  genre: string | null;
  artworkUrl: string | null;
  storageKey: string;
  isFavorite: boolean;
  createdAt: string;
};

export type Album = {
  id: string;
  name: string;
  artist: string;
  coverUrl: string | null;
  trackCount: number;
  durationSec: number;
};

export type Playlist = {
  id: string;
  name: string;
  coverUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlaylistDetail = Playlist & {
  tracks: Track[];
  trackCount: number;
  durationSec: number;
};

export type Catalog = {
  tracks: Track[];
  albums: Album[];
  playlists: Playlist[];
};
