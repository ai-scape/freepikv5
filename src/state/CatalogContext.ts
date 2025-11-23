import { createContext } from "react";
import type {
  FileEntry,
  WorkspaceConnection,
} from "../lib/api/files";

export type CatalogState = {
  entries: FileEntry[];
  filterExt: string[];
  q: string;
  selected?: FileEntry;
  connection?: WorkspaceConnection;
};

type CatalogActions = {
  setConnection(connection?: WorkspaceConnection | null): void;
  refreshTree(preferredPath?: string): Promise<void>;
  select(entry?: FileEntry): void;
  setFilters(filters: string[]): void;
  setQuery(value: string): void;
};

type CatalogContextValue = {
  state: CatalogState & { loading: boolean };
  actions: CatalogActions;
};

export const CatalogContext = createContext<CatalogContextValue | undefined>(
  undefined
);

export type { CatalogActions, CatalogContextValue };
