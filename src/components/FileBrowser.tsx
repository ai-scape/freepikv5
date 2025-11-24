import { useMemo, useState } from "react";
import { useCatalog } from "../state/useCatalog";
import { type FileEntry } from "../lib/api/files";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";
import { Spinner } from "./ui/Spinner";

const EXT_FILTERS = ["png", "jpg", "webp", "mp4", "webm"];

export default function FileBrowser() {
  const {
    state: { entries, q, filterExt, selected, loading, connection },
    actions: { setQuery, setFilters, select, refreshTree, rename, remove },
  } = useCatalog();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const handleRename = async (entry: FileEntry) => {
    if (!editName.trim() || editName === entry.name) {
      setEditingId(null);
      return;
    }
    try {
      await rename(entry, editName.trim());
    } catch (error) {
      console.error(error);
      alert("Failed to rename file");
    } finally {
      setEditingId(null);
    }
  };

  const handleDelete = async (entry: FileEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${entry.name}"?`)) return;
    try {
      await remove(entry);
    } catch (error) {
      console.error(error);
      alert("Failed to delete file");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!connection) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!connection) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    setUploadStatus(`Uploading ${files.length} file(s)...`);

    try {
      // Import uploadFile dynamically or use the one from props/context if available
      // But we can import it directly as we are in the same module scope as imports
      const { uploadFile } = await import("../lib/api/files");

      for (const file of files) {
        // Determine relative path. If we are in a subdirectory view, we might want to upload there.
        // But currently the file browser seems to show a flat list or filtered list.
        // The `entries` are flat. The `uploadFile` takes a relPath.
        // We'll upload to the root for now, or we could try to infer current directory if we had one.
        // Since `entries` is flat from `useCatalog`, we'll just upload to root.
        // Wait, `entries` has `relPath`.
        // Let's just upload to root for simplicity as per current architecture, 
        // or if we want to support folders later we can.
        // Actually, let's just use the filename as relPath for root.

        await uploadFile(connection, file.name, file);
      }
      await refreshTree();
      setUploadStatus(null);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus("Upload failed");
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const filteredEntries = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!connection) return false;
      const matchesQuery = query
        ? entry.name.toLowerCase().includes(query) ||
        entry.relPath.toLowerCase().includes(query)
        : true;
      const matchesExt =
        filterExt.length === 0 ||
        entry.kind === "dir" ||
        filterExt.includes(entry.ext);
      return matchesQuery && matchesExt;
    });
  }, [entries, q, filterExt, connection]);

  const toggleFilter = (ext: string) => {
    setFilters(
      filterExt.includes(ext)
        ? filterExt.filter((value) => value !== ext)
        : [...filterExt, ext]
    );
  };

  if (!connection) {
    return (
      <div className="rounded-lg border border-dashed border-white/20 bg-gradient-to-br from-sky-500/5 to-indigo-500/5 p-6 text-sm">
        <div className="mb-2 text-base font-semibold text-sky-200">
          📂 No Workspace Connected
        </div>
        <div className="text-slate-300">
          Click <strong>"Connect"</strong> at the top to link your workspace API and start browsing files.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search files"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400"
        />
        <button
          type="button"
          onClick={() => refreshTree()}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        {EXT_FILTERS.map((ext) => (
          <button
            key={ext}
            type="button"
            onClick={() => toggleFilter(ext)}
            className={`rounded-full px-3 py-1 font-semibold ${filterExt.includes(ext)
              ? "bg-sky-500/30 text-white"
              : "bg-white/10 text-slate-300"
              }`}
          >
            .{ext}
          </button>
        ))}
        {filterExt.length ? (
          <button
            type="button"
            onClick={() => setFilters([])}
            className="rounded-full px-3 py-1 font-semibold text-slate-300 hover:text-white"
          >
            Clear
          </button>
        ) : null}
      </div>

      <div
        className={`relative flex-1 overflow-auto rounded-lg border transition-colors ${isDragging
            ? "border-sky-400 bg-sky-500/10"
            : "border-white/10 bg-black/20"
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="rounded-xl border border-sky-500/30 bg-black/80 p-6 text-center shadow-2xl">
              <div className="mb-2 text-4xl">📥</div>
              <div className="text-lg font-semibold text-sky-200">Drop files to upload</div>
            </div>
          </div>
        )}
        {uploadStatus && (
          <div className="absolute top-2 right-2 z-20 rounded-md bg-sky-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
            {uploadStatus}
          </div>
        )}
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : filteredEntries.length === 0 && entries.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-sm text-center">
              <div className="mb-3 text-4xl">🎨</div>
              <div className="mb-2 text-base font-semibold text-white">
                No Files Yet
              </div>
              <div className="text-sm text-slate-300">
                Generate your first image or video using the controls on the left. Your files will appear here automatically!
              </div>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-300">
            <div className="mb-1">🔍 No files match your search</div>
            <div className="text-xs text-slate-400">Try a different search term or clear your filters</div>
          </div>
        ) : (
          <ul>
            {filteredEntries.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  draggable={entry.kind === "file"}
                  onDragStart={(event) => {
                    if (entry.kind === "file") {
                      event.dataTransfer.setData(
                        FILE_ENTRY_MIME,
                        JSON.stringify({
                          workspaceId: connection.workspaceId,
                          path: entry.relPath,
                          name: entry.name,
                          mime: entry.mime,
                        })
                      );
                      event.dataTransfer.effectAllowed = "copy";
                    }
                  }}
                  onClick={() => select(entry)}
                  className={`group flex w-full items-center justify-between gap-3 border-b border-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/5 ${selected?.id === entry.id ? "bg-white/10" : ""
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    {editingId === entry.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(entry)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(entry);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border border-sky-500/50 bg-black/50 px-1 py-0.5 text-white outline-none"
                      />
                    ) : (
                      <div
                        className="font-semibold text-white truncate"
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingId(entry.id);
                          setEditName(entry.name);
                        }}
                      >
                        {entry.name}
                        {entry.kind === "dir" ? "/" : ""}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 truncate">
                      {entry.relPath}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-right text-xs text-slate-400">
                    <span>
                      {entry.kind === "dir"
                        ? "Directory"
                        : `${(entry.size / 1024).toFixed(1)} kB`}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(entry, e)}
                      className="opacity-0 transition-opacity group-hover:opacity-100 p-1 hover:text-red-400"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
