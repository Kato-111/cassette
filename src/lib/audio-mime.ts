export const AUDIO_MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".flac": "audio/flac",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".wav": "audio/wav",
  ".aac": "audio/aac",
  ".webm": "audio/webm",
};

export const ACCEPTED_AUDIO_MIME_TYPES: string[] = Array.from(
  new Set(Object.values(AUDIO_MIME_BY_EXT)),
);
