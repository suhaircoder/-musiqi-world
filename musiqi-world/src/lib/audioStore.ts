const files = new Map<string, string>();

export function rememberAudio(id: string, file: File) {
  const current = files.get(id);
  if (current) URL.revokeObjectURL(current);
  const url = URL.createObjectURL(file);
  files.set(id, url);
  return url;
}

export function storedAudio(id: string) {
  return files.get(id) ?? "";
}

const ALLOWED = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
]);

export function validateAudioFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const extensionOk = ["mp3", "wav", "ogg", "m4a", "aac", "flac", "webm"].includes(extension);
  if (!extensionOk || (file.type && !ALLOWED.has(file.type) && file.type !== "application/octet-stream")) {
    return "Upload an audio file such as MP3, WAV, OGG, M4A, or FLAC.";
  }
  if (file.size > 40 * 1024 * 1024) return "Keep the file under 40 MB.";
  if (file.size < 1000) return "That file is empty.";
  return "";
}
