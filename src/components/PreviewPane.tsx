import { useEffect, useState } from "react";
import { getObjectURL, revokeURL } from "../fs/preview";
import { useCatalog } from "../state/catalog";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: number) {
  return new Date(value).toLocaleString();
}

export default function PreviewPane() {
  const {
    state: { selected, project },
  } = useCatalog();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleDragStart = (event: React.DragEvent) => {
    if (!selected || selected.kind !== "file") return;
    event.dataTransfer.setData(FILE_ENTRY_MIME, selected.relPath);
    event.dataTransfer.effectAllowed = "copy";
  };

  useEffect(() => {
    let cancelled = false;
    if (!project || !selected || selected.kind === "dir") {
      setError(null);
      setPreviewUrl((previous) => {
        if (previous) {
          revokeURL(previous);
        }
        return null;
      });
      return;
    }

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const url = await getObjectURL(project, selected.relPath);
        if (cancelled) {
          revokeURL(url);
          return;
        }
        setPreviewUrl((previous) => {
          if (previous) {
            revokeURL(previous);
          }
          return url;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to preview file.");
        setPreviewUrl((previous) => {
          if (previous) {
            revokeURL(previous);
          }
          return null;
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [project, selected]);

  if (!project) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 p-4 text-sm text-slate-400">
        Pick a project folder to preview assets.
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="rounded-lg border border-white/10 p-4 text-sm text-slate-400">
        Select a file from the browser to preview it here.
      </div>
    );
  }

  if (selected.kind === "dir") {
    return (
      <div className="rounded-lg border border-white/10 p-4 text-sm text-slate-400">
        "{selected.name}" is a directory. Select a file to preview its contents.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-base font-semibold text-white">
            {selected.name}
          </div>
          <div className="text-xs text-slate-400">{selected.relPath}</div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>{formatBytes(selected.size)}</div>
          <div>{formatDate(selected.mtime)}</div>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-white/10 bg-black/30 p-4">
        {error ? (
          <div className="text-sm text-rose-300">{error}</div>
        ) : loading || !previewUrl ? (
          <div className="text-sm text-slate-400">Loading preview…</div>
        ) : selected.mime.startsWith("video") ? (
          <video
            key={previewUrl}
            src={previewUrl}
            controls
            draggable={selected.kind === "file"}
            onDragStart={handleDragStart}
            className="h-full w-full rounded-xl border border-white/10 bg-black object-contain"
          />
        ) : (
          <img
            src={previewUrl}
            alt={selected.name}
            draggable={selected.kind === "file"}
            onDragStart={handleDragStart}
            className="h-full w-full rounded-xl border border-white/10 object-contain"
          />
        )}
      </div>

      {previewUrl ? (
        <div className="flex gap-2">
          <a
            href={previewUrl}
            download={selected.name}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
          >
            Download
          </a>
          <a
            href={previewUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
          >
            Open in New Tab
          </a>
        </div>
      ) : null}
    </div>
  );
}
