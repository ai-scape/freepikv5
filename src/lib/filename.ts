import { nanoid } from "nanoid";

function sanitizeSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function promptToSlug(prompt: string, seed?: string | number) {
  const base = sanitizeSegment(prompt);
  const seedPart =
    seed === undefined || seed === null || seed === ""
      ? ""
      : `_seed${sanitizeSegment(String(seed))}`;
  return (base.slice(0, 100) || "render") + seedPart;
}

export function buildFilename(
  modelId: string,
  prompt: string,
  extension: string,
  seed?: string | number
) {
  const slug = promptToSlug(prompt, seed);
  const trimmedExt = extension.replace(/^\.+/, "").toLowerCase();
  const unique = nanoid(6);
  return `${sanitizeSegment(modelId)}_${slug}_${unique}.${trimmedExt || "bin"}`;
}
