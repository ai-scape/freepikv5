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

export type WorkspaceConnection = {
  apiBase: string;
  workspaceId: string;
  token?: string;
};

const defaultApiBase = import.meta.env.VITE_FILE_API_BASE?.replace(/\/$/, "");
const defaultToken = import.meta.env.VITE_FILE_API_TOKEN;

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function encodeRelPath(relPath: string) {
  return relPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function getDefaultConnection(
  workspaceId = "default"
): WorkspaceConnection | null {
  if (!defaultApiBase) return null;
  return {
    apiBase: defaultApiBase,
    workspaceId,
    token: defaultToken || undefined,
  };
}

export function getFileUrl(
  connection: WorkspaceConnection,
  relPath: string,
  opts?: { includeToken?: boolean }
): string {
  const base = connection.apiBase.replace(/\/$/, "");
  const encoded = encodeRelPath(relPath);
  const url = new URL(
    `/files/${encodeURIComponent(connection.workspaceId)}/${encoded}`,
    base
  );
  if (opts?.includeToken && connection.token) {
    url.searchParams.set("token", connection.token);
  }
  return url.toString();
}

export async function listFiles(
  connection: WorkspaceConnection
): Promise<FileEntry[]> {
  const url = new URL("/files", connection.apiBase);
  url.searchParams.set("workspace", connection.workspaceId);
  const response = await fetch(url.toString(), {
    headers: authHeaders(connection.token),
  });
  if (!response.ok) {
    throw new Error(`List files failed: ${response.statusText}`);
  }
  const payload = await response.json();
  return Array.isArray(payload.entries) ? payload.entries : [];
}

export async function uploadFile(
  connection: WorkspaceConnection,
  relPath: string,
  blob: Blob
): Promise<void> {
  const url = new URL("/files", connection.apiBase);
  // Pass metadata in query params so server can process stream immediately
  url.searchParams.set("workspace", connection.workspaceId);
  url.searchParams.set("path", relPath);

  const form = new FormData();
  // We don't need to append workspace/path to form anymore
  const filename =
    relPath.split("/").filter(Boolean).pop() ?? `upload-${Date.now()}`;
  form.append("file", blob, filename);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: authHeaders(connection.token),
    body: form,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || `Upload failed with status ${response.statusText}`
    );
  }
}

export async function fetchFileBlob(
  connection: WorkspaceConnection,
  relPath: string
): Promise<Blob> {
  const response = await fetch(
    getFileUrl(connection, relPath, { includeToken: true }),
    {
      headers: authHeaders(connection.token),
    }
  );
  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }
  return response.blob();
}

export async function deleteFile(
  connection: WorkspaceConnection,
  relPath: string
): Promise<void> {
  const response = await fetch(new URL("/files", connection.apiBase), {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(connection.token),
    },
    body: JSON.stringify({
      workspace: connection.workspaceId,
      path: relPath,
    }),
  });
  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }
}

export async function listWorkspaces(
  apiBase: string,
  token?: string
): Promise<string[]> {
  const response = await fetch(new URL("/workspaces", apiBase), {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    throw new Error(`Fetch workspaces failed: ${response.statusText}`);
  }
  const payload = await response.json();
  return Array.isArray(payload.workspaces) ? payload.workspaces : [];
}

export async function createWorkspace(
  apiBase: string,
  token?: string,
  id?: string
): Promise<string> {
  const response = await fetch(new URL("/workspaces", apiBase), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(id ? { id } : {}),
  });
  if (!response.ok) {
    throw new Error(`Create workspace failed: ${response.statusText}`);
  }
  const payload = await response.json();
  if (!payload.workspaceId) {
    throw new Error("Workspace creation response missing id");
  }
  return payload.workspaceId;
}
