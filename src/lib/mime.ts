const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  mp4: "video/mp4",
  webm: "video/webm",
};

const MIME_TO_EXT: Record<string, string> = Object.entries(EXT_TO_MIME).reduce(
  (acc, [ext, mime]) => {
    acc[mime] = ext;
    return acc;
  },
  {} as Record<string, string>
);

export function guessMimeType(ext: string) {
  return EXT_TO_MIME[ext.toLowerCase()] ?? "application/octet-stream";
}

export function extensionFromMime(mime: string) {
  const normalized = mime.toLowerCase();
  if (MIME_TO_EXT[normalized]) {
    return MIME_TO_EXT[normalized];
  }
  const [type, subtype] = normalized.split("/");
  if (type === "image") {
    if (subtype === "jpeg") return "jpg";
    if (subtype) return subtype;
  }
  if (type === "video" && subtype) {
    return subtype;
  }
  return "bin";
}
