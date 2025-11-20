import { createContext } from "react";
import type { FileEntry } from "../fs/tree";

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

export const CatalogContext = createContext<CatalogContextValue | undefined>(
    undefined
);

export type { CatalogActions, CatalogContextValue };
