import { useMemo } from "react";
import { useCatalog } from "../state/useCatalog";
import { FILE_ENTRY_MIME } from "../lib/drag-constants";
import { Spinner } from "./ui/Spinner";

const EXT_FILTERS = ["png", "jpg", "webp", "mp4", "webm"];

export default function FileBrowser() {
  const {
    state: { entries, q, filterExt, selected, loading, connection },
    actions: { setQuery, setFilters, select, refreshTree },
  } = useCatalog();

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
  }, [entries, q, filterExt, project]);

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

      <div className="relative flex-1 overflow-auto rounded-lg border border-white/10 bg-black/20">
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
                  className={`flex w-full items-center justify-between gap-3 border-b border-white/5 px-3 py-2 text-left text-sm transition hover:bg-white/5 ${selected?.id === entry.id ? "bg-white/10" : ""
                    }`}
                >
                  <div>
                    <div className="font-semibold text-white">
                      {entry.name}
                      {entry.kind === "dir" ? "/" : ""}
                    </div>
                    <div className="text-xs text-slate-400">
                      {entry.relPath}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    {entry.kind === "dir"
                      ? "Directory"
                      : `${(entry.size / 1024).toFixed(1)} kB`}
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
