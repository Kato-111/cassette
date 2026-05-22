export const isImporterConfigured = (): boolean =>
  Boolean(
    process.env.MUSIC_IMPORTER_URL?.trim() &&
      process.env.IMPORTER_API_KEY?.trim(),
  );

export const importerBaseUrl = (): string => {
  const url = process.env.MUSIC_IMPORTER_URL?.trim();
  if (!url) throw new Error("MUSIC_IMPORTER_URL is not configured");
  return url.replace(/\/$/, "");
};

export const importerApiKey = (): string => {
  const key = process.env.IMPORTER_API_KEY?.trim();
  if (!key) throw new Error("IMPORTER_API_KEY is not configured");
  return key;
};

export const importerAuthHeader = (): string =>
  `Bearer ${importerApiKey()}`;
