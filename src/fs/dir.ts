import { openDB } from "idb";

type DirectoryPickerOptionsLike = {
  mode?: "read" | "readwrite";
};

type DirectoryHandleWithPerms = FileSystemDirectoryHandle & {
  queryPermission?(
    descriptor: DirectoryPickerOptionsLike
  ): Promise<PermissionState>;
  requestPermission?(
    descriptor: DirectoryPickerOptionsLike
  ): Promise<PermissionState>;
};

const DB_NAME = "fs-handles";
const STORE_NAME = "handles";
const PROJECT_KEY = "project";

async function getDb() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
  const storage = navigator.storage as StorageManager & {
    getDirectory?(): Promise<FileSystemDirectoryHandle>;
  };
  if (typeof storage?.getDirectory === "function") {
    return storage.getDirectory();
  }
  throw new Error("OPFS is not supported in this browser.");
}

export async function pickProjectDir(): Promise<FileSystemDirectoryHandle> {
  if ("showDirectoryPicker" in window) {
    try {
      return await (window as {
        showDirectoryPicker(
          options?: DirectoryPickerOptionsLike
        ): Promise<FileSystemDirectoryHandle>;
      }).showDirectoryPicker({
        mode: "readwrite",
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        // User cancelled — fall back to OPFS.
        return getOpfsRoot();
      }
      // For permission denied or other errors, try OPFS as well.
      return getOpfsRoot();
    }
  }
  return getOpfsRoot();
}

export async function saveHandle(handle: FileSystemDirectoryHandle) {
  try {
    const db = await getDb();
    await db.put(STORE_NAME, handle, PROJECT_KEY);
  } catch {
    // Ignore persistence errors; IndexedDB may be unavailable.
  }
}

export async function loadSavedHandle(): Promise<
  FileSystemDirectoryHandle | null
> {
  try {
    const db = await getDb();
    const handle = (await db.get(
      STORE_NAME,
      PROJECT_KEY
    )) as FileSystemDirectoryHandle | undefined;
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function ensureRW(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  const options: DirectoryPickerOptionsLike = { mode: "readwrite" };
  const permissionHandle = handle as DirectoryHandleWithPerms;
  if (
    typeof permissionHandle.queryPermission !== "function" ||
    typeof permissionHandle.requestPermission !== "function"
  ) {
    return true;
  }
  const query = await permissionHandle.queryPermission(options);
  if (query === "granted") {
    return true;
  }
  const requested = await permissionHandle.requestPermission(options);
  return requested === "granted";
}

export async function resolvePath(
  root: FileSystemDirectoryHandle,
  relPath: string
): Promise<{
  parent: FileSystemDirectoryHandle;
  file?: FileSystemFileHandle;
  dir?: FileSystemDirectoryHandle;
}> {
  const parts = relPath
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (!parts.length) {
    return { parent: root, dir: root };
  }

  let currentDir = root;
  for (let index = 0; index < parts.length; index += 1) {
    const segment = parts[index] ?? "";
    const isLast = index === parts.length - 1;

    if (isLast) {
      try {
        const dirHandle = await currentDir.getDirectoryHandle(segment);
        return { parent: currentDir, dir: dirHandle };
      } catch {
        // Not a directory.
      }
      try {
        const fileHandle = await currentDir.getFileHandle(segment);
        return { parent: currentDir, file: fileHandle };
      } catch {
        return { parent: currentDir };
      }
    }

    try {
      currentDir = await currentDir.getDirectoryHandle(segment);
    } catch {
      return { parent: currentDir };
    }
  }

  return { parent: currentDir };
}
