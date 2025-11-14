export async function getObjectURL(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<string> {
  const parts = relPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!parts.length) {
    throw new Error("Cannot preview directory.");
  }

  const fileName = parts.pop()!;
  let currentDir = root;
  for (const segment of parts) {
    currentDir = await currentDir.getDirectoryHandle(segment);
  }

  const fileHandle = await currentDir.getFileHandle(fileName);
  const file = await fileHandle.getFile();
  return URL.createObjectURL(file);
}

export function revokeURL(url: string): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}
