import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { walk, type FileEntry } from "../fs/tree";

export type CatalogState = {
  entries: FileEntry[];
  filterExt: string[];
  q: string;
  selected?: FileEntry;
  project?: FileSystemDirectoryHandle;
};

type CatalogActions = {
  setProject(handle?: FileSystemDirectoryHandle | null): void;
  refreshTree(preferredPath?: string): Promise<void>;
  select(entry?: FileEntry): void;
  setFilters(filters: string[]): void;
  setQuery(value: string): void;
};

type CatalogContextValue = {
  state: CatalogState & { loading: boolean };
  actions: CatalogActions;
};

const CatalogContext = createContext<CatalogContextValue | undefined>(
  undefined
);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [filterExt, setFilterExt] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<FileEntry | undefined>();
  const [project, setProjectState] = useState<
    FileSystemDirectoryHandle | undefined
  >();
  const [loading, setLoading] = useState(false);

  const refreshTree = useCallback(async (preferredPath?: string) => {
    if (!project) return;
    setLoading(true);
    try {
      const nextEntries = await walk(project);
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
  }, [project]);

  useEffect(() => {
    if (!project) {
      setEntries([]);
      setSelected(undefined);
      return;
    }
    void refreshTree();
  }, [project, refreshTree]);

  const setProject = useCallback(
    (handle?: FileSystemDirectoryHandle | null) => {
      setProjectState(handle ?? undefined);
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
        project,
        loading,
      },
      actions: {
        setProject,
        refreshTree,
        select: (entry?: FileEntry) => setSelected(entry),
        setFilters: (filters: string[]) => setFilterExt(filters),
        setQuery: (value: string) => setQ(value),
      },
    }),
    [entries, filterExt, q, selected, project, loading, setProject, refreshTree]
  );

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within a CatalogProvider.");
  }
  return context;
}
