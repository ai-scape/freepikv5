import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  listFiles,
  type FileEntry,
  type WorkspaceConnection,
} from "../lib/api/files";
import { CatalogContext, type CatalogContextValue } from "./CatalogContext";

export type { CatalogState } from "./CatalogContext";

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [filterExt, setFilterExt] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FileEntry | undefined>();
  const [connection, setConnectionState] = useState<
    WorkspaceConnection | undefined
  >();
  const [loading, setLoading] = useState(false);

  const refreshTree = useCallback(async (preferredPath?: string) => {
    if (!connection) return;
    setLoading(true);
    try {
      const nextEntries = await listFiles(connection);
      setEntries(nextEntries);
      if (!nextEntries.length) {
        setSelected(undefined);
        return;
      }
      setSelected((previous) => {
        if (preferredPath) {
          const match = nextEntries.find(
            (entry) => entry.relPath === preferredPath
          );
          if (match) {
            return match;
          }
        }
        if (!previous) return nextEntries[0];
        return (
          nextEntries.find((entry) => entry.relPath === previous.relPath) ??
          nextEntries[0]
        );
      });
    } finally {
      setLoading(false);
    }
  }, [connection]);

  useEffect(() => {
    if (!connection) {
      setEntries([]);
      setSelected(undefined);
      return;
    }
    void refreshTree();
  }, [connection, refreshTree]);

  const setConnection = useCallback(
    (value?: WorkspaceConnection | null) => {
      setConnectionState(value ?? undefined);
    },
    []
  );

  const value = useMemo<CatalogContextValue>(
    () => ({
      state: {
        entries,
        filterExt,
        q,
        selected,
        connection,
        loading,
      },
      actions: {
        setConnection,
        refreshTree,
        select: (entry?: FileEntry) => setSelected(entry),
        setFilters: (filters: string[]) => setFilterExt(filters),
        setQuery: (value: string) => setQ(value),
      },
    }),
    [
      entries,
      filterExt,
      q,
      selected,
      connection,
      loading,
      setConnection,
      refreshTree,
    ]
  );

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}
