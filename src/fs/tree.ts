import { guessMimeType } from "../lib/mime";

export type FileEntry = {
  id: string;
  name: string;
  relPath: string;
  kind: "file" | "dir";
  ext: string;
  size: number;
  mtime: number;
  mime: string;
};

async function readDirectory(
  handle: FileSystemDirectoryHandle,
  baseRel = ""
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  for await (const [name, child] of (handle as unknown as {
    entries(): AsyncIterable<[string, FileSystemHandle]>;
  }).entries()) {
    const relPath = baseRel ? `${baseRel}/${name}` : name;
    if (child.kind === "directory") {
      entries.push({
        id: relPath,
        name,
        relPath,
        kind: "dir",
        ext: "",
        size: 0,
        mtime: 0,
        mime: "",
      });
      const nested = await readDirectory(
        child as FileSystemDirectoryHandle,
        relPath
      );
      entries.push(...nested);
      continue;
    }

    const fileHandle = child as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    const ext = (name.split(".").pop() ?? "").toLowerCase();
    entries.push({
      id: relPath,
      name,
      relPath,
      kind: "file",
      ext,
      size: file.size,
      mtime: file.lastModified,
      mime: file.type || guessMimeType(ext),
    });
  }

  return entries;
}

export async function walk(
  root: FileSystemDirectoryHandle,
  baseRel = ""
): Promise<FileEntry[]> {
  const results = await readDirectory(root, baseRel);
  return results.sort((a, b) => b.mtime - a.mtime);
}
