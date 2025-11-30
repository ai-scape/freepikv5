import { useMemo, useState, useEffect } from "react";
import { useCatalog } from "../state/useCatalog";
import { type FileEntry, getFileUrl, publishFile } from "../lib/api/files";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";
import { Spinner } from "./ui/Spinner";
import { PublishModal } from "./PublishModal";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp"];
const VIDEO_EXTS = ["mp4", "webm", "mov", "mkv"];

export default function FileBrowser() {
  const {
    state: { entries, q, filterExt, selected, loading, connection },
    actions: { setQuery, setFilters, select, refreshTree, rename, remove },
  } = useCatalog();

  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [publishingEntry, setPublishingEntry] = useState<FileEntry | null>(null);
  const [editName, setEditName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [fileDims, setFileDims] = useState<Record<string, { w: number; h: number }>>({});

  const getFileStyles = (entry: FileEntry) => {
    if (entry.mime.startsWith("image/")) {
      return {
        grid: "border-red-500/50 bg-red-500/5",
        list: "border-l-red-500/50",
      };
    }
    if (entry.mime.startsWith("video/")) {
      const dims = fileDims[entry.id];
      if (!dims)
        return {
          grid: "border-white/10 bg-black/40",
          list: "border-l-transparent",
        }; // Default until loaded
      if (dims.h >= 1080) {
        return {
          grid: "border-green-500/50 bg-green-500/5",
          list: "border-l-green-500/50",
        };
      }
      return {
        grid: "border-blue-500/50 bg-blue-500/5",
        list: "border-l-blue-500/50",
      };
    }
    return {
      grid: "border-white/10 bg-black/40",
      list: "border-l-transparent",
    };
  };

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
      const { uploadFile } = await import("../lib/api/files");

      let successCount = 0;
      let failCount = 0;

      for (const file of files) {
        try {
          await uploadFile(connection, file.name, file);
          successCount++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          failCount++;
        }
      }

      await refreshTree();

      if (failCount > 0) {
        setUploadStatus(`Uploaded ${successCount} files. ${failCount} failed.`);
      } else {
        setUploadStatus(`Uploaded ${successCount} files successfully.`);
      }

      setTimeout(() => setUploadStatus(null), 3000);
    } catch (error) {
      console.error("Upload process failed:", error);
      setUploadStatus("Upload process failed");
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handlePublish = async (metadata: {
    project: string;
    sequence: string;
    shot: string;
    version: string;
  }) => {
    if (!connection || !publishingEntry) return;

    try {
      await publishFile(connection, publishingEntry.relPath, metadata);
      setPublishingEntry(null);
      alert("File published successfully!");
    } catch (error) {
      console.error("Publish failed:", error);
      throw error; // Re-throw for modal to handle
    }
  };

  const filteredEntries = useMemo(() => {
    const query = q.trim().toLowerCase();
    return entries.filter((entry) => {
      if (!connection) return false;

      // 1. Basic Exclusion: No directories, no dotfiles
      if (entry.kind === "dir") return false;
      if (entry.name.startsWith(".")) return false;

      // 2. Mime Type Check: Only images and videos
      const isMedia = entry.mime.startsWith("image/") || entry.mime.startsWith("video/");
      if (!isMedia) return false;

      // 3. Search Query
      const matchesQuery = query
        ? entry.name.toLowerCase().includes(query) ||
        entry.relPath.toLowerCase().includes(query)
        : true;

      // 4. Extension Filter (if active)
      const matchesExt =
        filterExt.length === 0 ||
        filterExt.includes(entry.ext);

      return matchesQuery && matchesExt;
    });
  }, [entries, q, filterExt, connection]);

  // Cleanup fileDims for removed files
  // Cleanup fileDims for removed files
  useEffect(() => {
    setFileDims((prev) => {
      const next = { ...prev };
      let changed = false;
      const currentIds = new Set(entries.map((e) => e.id));
      for (const id in next) {
        if (!currentIds.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [entries]);

  const toggleGroup = (group: "images" | "videos") => {
    const groupExts = group === "images" ? IMAGE_EXTS : VIDEO_EXTS;
    const allSelected = groupExts.every((ext) => filterExt.includes(ext));

    if (allSelected) {
      // Remove all extensions from this group
      setFilters(filterExt.filter((ext) => !groupExts.includes(ext)));
    } else {
      // Add all extensions from this group (avoiding duplicates)
      const newFilters = new Set([...filterExt, ...groupExts]);
      setFilters(Array.from(newFilters));
    }
  };

  const isImagesActive = IMAGE_EXTS.every((ext) => filterExt.includes(ext));
  const isVideosActive = VIDEO_EXTS.every((ext) => filterExt.includes(ext));

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
        <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${viewMode === "list"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-white"
              }`}
            title="List View"
          >
            ☰
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded px-2 py-1.5 text-xs font-medium transition-colors ${viewMode === "grid"
              ? "bg-white/10 text-white"
              : "text-slate-400 hover:text-white"
              }`}
            title="Grid View"
          >
            ⊞
          </button>
        </div>
        <button
          type="button"
          onClick={() => refreshTree()}
          className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-sky-400 hover:text-sky-200"
        >
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-1 text-xs">
        <button
          type="button"
          onClick={() => toggleGroup("images")}
          className={`rounded-full px-3 py-1 font-semibold transition-colors ${isImagesActive
            ? "bg-sky-500/30 text-white"
            : "bg-white/10 text-slate-300 hover:text-white"
            }`}
        >
          Images
        </button>
        <button
          type="button"
          onClick={() => toggleGroup("videos")}
          className={`rounded-full px-3 py-1 font-semibold transition-colors ${isVideosActive
            ? "bg-sky-500/30 text-white"
            : "bg-white/10 text-slate-300 hover:text-white"
            }`}
        >
          Videos
        </button>
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
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3">
            {filteredEntries.map((entry) => {
              const url = getFileUrl(connection, entry.relPath, { includeToken: true });
              const styles = getFileStyles(entry);

              return (
                <button
                  key={entry.id}
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
                      event.dataTransfer.setData("DownloadURL", `${entry.mime}:${entry.name}:${url}`);
                    }
                  }}
                  onClick={() => select(entry)}
                  className={`group relative flex aspect-square flex-col overflow-hidden rounded-lg border transition ${selected?.id === entry.id ? "ring-2 ring-yellow-500" : ""
                    } ${styles.grid}`}
                >
                  <div className="flex-1 w-full overflow-hidden bg-white/5">
                    {entry.kind === "dir" ? (
                      <div className="flex h-full items-center justify-center text-4xl">
                        📁
                      </div>
                    ) : entry.mime.startsWith("video") ? (
                      <video
                        src={url}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                        loop
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                        onLoadedMetadata={(e) => {
                          const target = e.target as HTMLVideoElement;
                          setFileDims((prev) => ({
                            ...prev,
                            [entry.id]: { w: target.videoWidth, h: target.videoHeight },
                          }));
                        }}
                      />
                    ) : (
                      <img
                        src={url}
                        alt={entry.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          setFileDims((prev) => ({
                            ...prev,
                            [entry.id]: { w: target.naturalWidth, h: target.naturalHeight },
                          }));
                        }}
                      />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 backdrop-blur-sm">
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
                        className="w-full rounded border border-sky-500/50 bg-black/50 px-1 py-0.5 text-xs text-white outline-none"
                      />
                    ) : (
                      <div
                        className="truncate text-xs text-white cursor-text"
                        title={entry.name}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingId(entry.id);
                          setEditName(entry.name);
                        }}
                      >
                        {entry.name}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPublishingEntry(entry);
                    }}
                    className="absolute top-1 right-8 rounded bg-black/60 p-1 text-xs opacity-0 transition-opacity hover:bg-sky-500 hover:text-white group-hover:opacity-100"
                    title="Publish"
                  >
                    🚀
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(entry, e)}
                    className="absolute top-1 right-1 rounded bg-black/60 p-1 text-xs opacity-0 transition-opacity hover:bg-red-500 hover:text-white group-hover:opacity-100"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </button>
              );
            })}
          </div>
        ) : (
          <ul>
            {filteredEntries.map((entry) => {
              const url = getFileUrl(connection, entry.relPath, { includeToken: true });
              const styles = getFileStyles(entry);
              const dims = fileDims[entry.id];

              return (
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
                        event.dataTransfer.setData("DownloadURL", `${entry.mime}:${entry.name}:${url}`);
                      }
                    }}
                    onClick={() => select(entry)}
                    className={`group flex w-full items-center justify-between gap-3 border-l-4 px-3 py-2 text-left text-sm transition ${selected?.id === entry.id ? "bg-yellow-500/20" : ""
                      } ${styles.list}`}
                  >
                    {/* Hidden media for metadata capture */}
                    {!dims && entry.kind === "file" && (
                      <div className="hidden">
                        {entry.mime.startsWith("video") ? (
                          <video
                            src={url}
                            preload="metadata"
                            onLoadedMetadata={(e) => {
                              const target = e.target as HTMLVideoElement;
                              setFileDims((prev) => ({
                                ...prev,
                                [entry.id]: { w: target.videoWidth, h: target.videoHeight },
                              }));
                            }}
                          />
                        ) : entry.mime.startsWith("image") ? (
                          <img
                            src={url}
                            loading="lazy"
                            onLoad={(e) => {
                              const target = e.target as HTMLImageElement;
                              setFileDims((prev) => ({
                                ...prev,
                                [entry.id]: { w: target.naturalWidth, h: target.naturalHeight },
                              }));
                            }}
                          />
                        ) : null}
                      </div>
                    )}

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
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="font-semibold text-white truncate"
                            title={entry.name}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              setEditingId(entry.id);
                              setEditName(entry.name);
                            }}
                          >
                            {entry.name}
                            {entry.kind === "dir" ? "/" : ""}
                          </div>
                          {dims && (
                            <span className="flex-shrink-0 text-[10px] text-slate-500 font-mono">
                              {dims.w}x{dims.h} ({(() => {
                                const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
                                const div = gcd(dims.w, dims.h);
                                return `${dims.w / div}:${dims.h / div}`;
                              })()})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-right text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPublishingEntry(entry);
                        }}
                        className="opacity-0 transition-opacity group-hover:opacity-100 p-1 hover:text-sky-400"
                        title="Publish"
                      >
                        🚀
                      </button>
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
              );
            })}
          </ul>
        )}
      </div>

      {publishingEntry && (
        <PublishModal
          fileName={publishingEntry.name}
          defaultProject={connection.workspaceId !== "default" ? connection.workspaceId : ""}
          onConfirm={handlePublish}
          onCancel={() => setPublishingEntry(null)}
        />
      )}
    </div>
  );
}
