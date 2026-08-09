export type ImportSource = "youtube" | "spotify";

export interface ImportItem {
  sourceItemId: string;
  title: string;
  artist: string;
  album?: string;
  durationSec: number;
  sourceUrl: string;
  thumbnailUrl?: string;
}

export interface DownloadedAudio {
  filePath: string;
  mime: string;
  ext: string;
}

export interface ImportProvider {
  source: ImportSource;
  canHandle(url: string): boolean;
  listItems(url: string): Promise<ImportItem[]>;
  downloadItem(item: ImportItem, destDir: string): Promise<DownloadedAudio>;
}

export interface ImportJobError {
  sourceItemId: string;
  title: string;
  message: string;
}
