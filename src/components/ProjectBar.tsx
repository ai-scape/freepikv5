import { useEffect, useMemo, useState } from "react";
import {
  createWorkspace,
  getDefaultConnection,
  listFiles,
  listWorkspaces,
  type WorkspaceConnection,
} from "../lib/api/files";
import { useCatalog } from "../state/useCatalog";
import { Tooltip, InfoIcon } from "./ui/Tooltip";
import { useQueue } from "../state/queue";
import QueueLog from "./QueueLog";
import CreditTracker from "./CreditTracker";

const STORAGE_KEY = "file-api-connection";

function loadSavedConnection(): WorkspaceConnection | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceConnection;
    if (parsed.apiBase && parsed.workspaceId) {
      return parsed;
    }
  } catch {
    // Ignore malformed storage.
  }
  return null;
}

function persistConnection(connection: WorkspaceConnection | null) {
  if (typeof localStorage === "undefined") return;
  if (!connection) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
}

export default function ProjectBar() {
  const {
    state: { connection },
    actions: { setConnection },
  } = useCatalog();
  const defaultConnection = useMemo(() => getDefaultConnection(), []);
  const [apiBase, setApiBase] = useState(
    defaultConnection?.apiBase ?? "http://localhost:8787"
  );
  const [workspaceId, setWorkspaceId] = useState(
    defaultConnection?.workspaceId ?? "default"
  );
  const [token, setToken] = useState(defaultConnection?.token ?? "");
  const [workspaces, setWorkspaces] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = loadSavedConnection();
    if (saved) {
      setApiBase(saved.apiBase);
      setWorkspaceId(saved.workspaceId);
      setToken(saved.token ?? "");
      setConnection(saved);
      setStatus(`Restored workspace "${saved.workspaceId}".`);
      return;
    }
    if (defaultConnection) {
      setConnection(defaultConnection);
      setStatus(`Using default workspace "${defaultConnection.workspaceId}".`);
    }
  }, [defaultConnection, setConnection]);

  useEffect(() => {
    if (!apiBase) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await listWorkspaces(apiBase, token || undefined);
        if (!cancelled) {
          setWorkspaces(list);
        }
      } catch {
        if (!cancelled) {
          setWorkspaces([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiBase, token]);

  const handleConnect = async () => {
    const base = apiBase.trim().replace(/\/$/, "");
    const ws = workspaceId.trim() || "default";
    if (!base) {
      setStatus("Enter the file API base URL.");
      return;
    }
    const connectionAttempt: WorkspaceConnection = {
      apiBase: base,
      workspaceId: ws,
      token: token.trim() || undefined,
    };
    setBusy(true);
    try {
      await listFiles(connectionAttempt);
      setConnection(connectionAttempt);
      persistConnection(connectionAttempt);
      setStatus(`✅ Connected to workspace "${ws}".`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Unable to connect to workspace."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleCreateWorkspace = async () => {
    const base = apiBase.trim().replace(/\/$/, "");
    if (!base) {
      setStatus("Enter the file API base URL before creating a workspace.");
      return;
    }
    setBusy(true);
    try {
      const id = await createWorkspace(base, token.trim() || undefined, workspaceId.trim() || undefined);
      setWorkspaceId(id);
      setWorkspaces((previous) =>
        Array.from(new Set([id, ...previous]))
      );
      setStatus(`🆕 Workspace "${id}" created. Click Connect to use it.`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `❌ ${error.message}`
          : "❌ Unable to create workspace."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    setConnection(undefined);
    persistConnection(null);
    setStatus("Disconnected from workspace.");
  };

  const connectionLabel = connection
    ? `${connection.workspaceId} @ ${connection.apiBase}`
    : "No workspace connected";

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-lg">
      <div className="flex flex-col gap-3 px-4 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Workspace
              </span>
              <Tooltip text="Connect to the file API that will save and stream your renders.">
                <InfoIcon className="h-3 w-3 text-slate-500" />
              </Tooltip>
            </div>
            <span className="font-semibold text-white">{connectionLabel}</span>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <input
              type="url"
              value={apiBase}
              onChange={(event) => setApiBase(event.target.value)}
              placeholder="http://localhost:8787"
              className="w-48 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            />
            <input
              type="text"
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              list="workspace-options"
              placeholder="workspace id"
              className="w-32 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            />
            <datalist id="workspace-options">
              {workspaces.map((ws) => (
                <option key={ws} value={ws} />
              ))}
            </datalist>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="API token"
              className="w-36 rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
            />
            <button
              type="button"
              onClick={handleConnect}
              disabled={busy}
              className="rounded-full border border-white/20 px-3 py-1 font-semibold text-xs text-white transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Connecting…" : connection ? "Reconnect" : "Connect"}
            </button>
            <button
              type="button"
              onClick={handleCreateWorkspace}
              disabled={busy}
              className="rounded-full border border-white/10 px-3 py-1 font-semibold text-xs text-slate-200 transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              New Workspace
            </button>
            {connection ? (
              <Tooltip text="Disconnect clears the saved workspace link. Your files stay on the server.">
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="rounded-full border border-white/10 px-3 py-1 font-semibold text-xs text-slate-200 transition hover:border-amber-400 hover:text-amber-100"
                >
                  Disconnect
                </button>
              </Tooltip>
            ) : null}
            <div className="h-4 w-px bg-white/10 mx-1" />
            <CreditTracker />
            <QueueButton />
            <a
              href="https://github.com/ai-scape/freepikv5/tree/main"
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 text-slate-400 transition hover:border-sky-400 hover:text-white"
              title="Help & Documentation"
            >
              <span className="text-xs font-bold">?</span>
            </a>
          </div>
        </div>
      </div>
      {status ? (
        <div className="border-t border-white/5 bg-white/5 px-4 py-2 text-xs text-slate-300">
          {status}
        </div>
      ) : !connection ? (
        <div className="border-t border-white/5 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 px-4 py-2 text-xs text-sky-200">
          👉 <strong>Getting Started:</strong> Enter your file API URL, workspace, and token, then click Connect.
        </div>
      ) : null}
      <QueueLog />
    </header>
  );
}

function QueueButton() {
  const { jobs, toggleLog, isLogOpen } = useQueue();
  const activeCount = jobs.filter((j) => j.status === "processing" || j.status === "pending").length;

  return (
    <button
      onClick={toggleLog}
      className={`relative rounded-full border px-3 py-1 font-semibold text-xs transition ${isLogOpen || activeCount > 0
        ? "border-sky-500 text-sky-400 bg-sky-500/10"
        : "border-white/10 text-slate-400 hover:text-white"
        }`}
    >
      Queue
      {activeCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-sky-500 text-[9px] text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}
