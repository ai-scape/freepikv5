import { useEffect, useState } from "react";
import {
  ensureRW,
  loadSavedHandle,
  pickProjectDir,
  saveHandle,
} from "../fs/dir";
import { useCatalog } from "../state/catalog";

export default function ProjectBar() {
  const {
    state: { project },
    actions: { setProject },
  } = useCatalog();
  const [persistGranted, setPersistGranted] = useState<boolean | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const saved = await loadSavedHandle();
      if (!saved || cancelled) return;
      const granted = await ensureRW(saved);
      if (granted && !cancelled) {
        setProject(saved);
        setStatus("Restored project folder.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setProject]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!("storage" in navigator) || typeof navigator.storage.persist !== "function") {
        setPersistGranted(null);
        return;
      }
      try {
        const granted = await navigator.storage.persist();
        if (!cancelled) {
          setPersistGranted(granted);
        }
      } catch {
        if (!cancelled) {
          setPersistGranted(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePick = async () => {
    setBusy(true);
    try {
      const handle = await pickProjectDir();
      const granted = await ensureRW(handle);
      if (!granted) {
        setStatus("Permission denied for selected folder.");
        return;
      }
      await saveHandle(handle);
      setProject(handle);
      setStatus(`Connected to ${handle.name || "OPFS workspace"}.`);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to pick project folder."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleReRequest = async () => {
    if (!project) {
      setStatus("Pick a project folder first.");
      return;
    }
    try {
      const granted = await ensureRW(project);
      setStatus(
        granted ? "Permission refreshed." : "Permission request was denied."
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "Unable to refresh permissions."
      );
    }
  };

  const projectLabel = project?.name
    ? project.name
    : project
      ? "OPFS workspace"
      : "No project selected";

  const persistLabel =
    persistGranted === null
      ? "Unknown persistence"
      : persistGranted
        ? "Storage persisted"
        : "Ephemeral storage";
  const persistClass =
    persistGranted === null
      ? "bg-slate-600/20 text-slate-200"
      : persistGranted
        ? "bg-emerald-500/20 text-emerald-200"
        : "bg-amber-500/20 text-amber-200";

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/70 backdrop-blur-lg">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            Project Folder
          </span>
          <span className="font-semibold text-white">{projectLabel}</span>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${persistClass}`}>
            {persistLabel}
          </span>
          <button
            type="button"
            onClick={handlePick}
            disabled={busy}
            className="rounded-full border border-white/20 px-3 py-1 font-semibold text-xs text-white transition hover:border-sky-400 hover:text-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Connecting…" : "Pick Folder"}
          </button>
          <button
            type="button"
            onClick={handleReRequest}
            className="rounded-full border border-white/10 px-3 py-1 font-semibold text-xs text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
          >
            Re-request Permission
          </button>
        </div>
      </div>
      {status ? (
        <div className="border-t border-white/5 bg-white/5 px-4 py-2 text-xs text-slate-300">
          {status}
        </div>
      ) : null}
    </header>
  );
}
