export async function writeBlob(
  root: FileSystemDirectoryHandle,
  relPath: string,
  blob: Blob
): Promise<void> {
  const parts = relPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!parts.length) {
    throw new Error("Invalid path for writing blob.");
  }

  const fileName = parts.pop()!;
  let currentDir = root;
  for (const segment of parts) {
    currentDir = await currentDir.getDirectoryHandle(segment, {
      create: true,
    });
  }

  const fileHandle = await currentDir.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
}
