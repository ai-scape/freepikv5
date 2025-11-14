# Agents Playbook

Use this reference alongside `README.md` and `docs/AGENT_GUIDE.md` when you need to reason about the Freepik Clone codebase, extend a workflow, or debug issues.

## 1. Snapshot
- **Stack:** React 19 + TypeScript + Vite 7 + TailwindCSS. Everything runs in the browser; there are no `/api/assets` endpoints or Node middlewares.
- **Layout:** `src/app/page.tsx` renders a fixed grid: `ProjectBar` (top), then three columns — `ControlsPane` (320 px), `FileBrowser`, and `PreviewPane`.
- **State:** `src/state/catalog.tsx` stores the selected directory handle, the current file tree, filters/search query, and the selected entry. Actions are `setProject`, `refreshTree(preferredPath?)`, `select`, `setFilters`, and `setQuery`.
- **Persistence:** All assets are written via the File System Access API. If the user declines folder access, the app falls back to OPFS through `navigator.storage.getDirectory()`.

## 2. Storage & FS Helpers (`src/fs`)
- `dir.ts`
  - `pickProjectDir()` shows the directory picker (read/write) and falls back to OPFS if it fails.
  - `loadSavedHandle()` / `saveHandle()` persist handles in IndexedDB (`fs-handles/project`).
  - `ensureRW()` re-requests read/write permission; skip direct calls to `queryPermission`.
  - `resolvePath()` walks path segments to find the parent handle and an optional file handle.
- `write.ts` — writes blobs to nested directories using `createWritable()`.
- `tree.ts` — walks the directory recursively and produces `FileEntry` objects (id, ext, mime, size, mtime). Sorted by newest first.
- `preview.ts` — `getObjectURL()` loads a file as an object URL; `revokeURL()` frees it.

## 3. Provider Integration (`src/lib`)
- `providers/index.ts` exposes:
  - `callModelEndpoint(provider, endpoint, payload, options)` — routes to the correct client (FAL or KIE) and normalizes `{ blob?: Blob; url?: string }`.
  - `getProviderKey(provider)` / `getProviderEnvVar(provider)` — helpers for checking `VITE_FAL_KEY` and `VITE_KIE_KEY`.
- `fal.ts` keeps the fetch client + `uploadToFal(file)` FormData helper for drag-and-drop workflows.
- `kie.ts` adds task-polling support for endpoints that return `taskId` + status APIs.
- `models.json` + `models-extra.ts` describe video pipelines. `MODEL_SPECS` merges both; `buildModelInput` turns a `UnifiedPayload` into the endpoint payload.
- `image-models.ts` enumerates edit/text modes with `mapInput` helpers.
- `pricing.ts` maps model IDs to `{ amount, currency, unit }`; the controls pane shows the formatted label next to the Generate button.
- `mime.ts` keeps the extension ↔ mime map used by filters and previews.
- `filename.ts` sanitises prompts and produces filenames like `model_prompt_seed_xxxxxx.ext`.

## 4. UI Components
- `ProjectBar`
  - Restores saved handles on mount, calls `ensureRW`, and sets the project handle inside the catalog store.
  - Shows `navigator.storage.persist()` status, “Pick Folder,” and “Re-request Permission” buttons. Respect this pattern when extending storage UX.
- `ControlsPane`
  - Houses the prompt/model controls, seed input, and drag-and-drop upload zones (start frame, optional end frame, image references). Each drop kicks off `uploadToFal`.
  - Builds payloads using `buildModelInput` (video) or `spec.mapInput` (image), and auto-renders every parameter described in the selected `ModelSpec`. When you add/edit params in `models.json` the UI updates automatically.
  - Calls `callModelEndpoint` (provider-aware), derives the file extension from the blob’s mime, generates a filename with `buildFilename`, and writes to `images/` or `videos/` date folders via `writeBlob`.
  - After writing, it awaits `refreshTree(relPath)` so the new entry is selected in the browser.
- `FileBrowser`
  - Uses catalog state to render search input, extension chips, and file list. Filter chips live in `EXT_FILTERS`; update both the chip list and `mime.ts` when adding formats.
  - Clicking a row triggers `select(entry)`; the right column instantly previews it.
- `PreviewPane`
  - Creates object URLs with `getObjectURL`, revokes them when selections change, and renders `<img>` or `<video>` plus metadata (size + modified date).
  - If the entry is a directory, it prompts the user to pick a file instead.

## 5. Primary Flow
1. Project bar loads the saved handle (IndexedDB) and re-requests permission.
2. User configures prompts/uploads in `ControlsPane` (provider keys come from `VITE_FAL_KEY` / `VITE_KIE_KEY`).
3. `callModelEndpoint` returns a blob; `writeBlob` stores it under `images/YYYY-MM-DD` or `videos/YYYY-MM-DD`.
4. `refreshTree(relPath)` reloads the directory tree and selects the written file.
5. `FileBrowser` shows the entry; `PreviewPane` streams it inline.

## 6. Dev Guardrails
- **Browser requirement:** Chromium only. If you add features, guard them behind capability checks and keep OPFS fallback logic intact.
- **Do not** reintroduce `/api/assets`, `out/`, or `@fal-ai/client`.
- **Naming:** If you change how filenames are built, adjust `filename.ts` and keep the `model + slug + nanoid` pattern so automations can trace renders.
- **Pricing:** Update `pricing.ts` when adding/changing models so the badge stays correct.
- **Mime/filter updates:** Extend `mime.ts`, adjust `EXT_FILTERS`, and ensure `PreviewPane` knows how to render the new type.
- **Lint/tests:** Run `npm run lint` and `npm run build`. Manual smoke test: pick folder → ensure `VITE_FAL_KEY` is set → drop start/reference frames → run both an image + a video model → reload → confirm folder auto-restores and previews still load.

## 7. Extension Checklist
1. **New video model**
   - Update `models.json` or `models-extra.ts` and add a pricing entry.
   - Ensure `ControlsPane` exposes any new params; use `UnifiedPayload` keys or extend the form.
2. **New image model**
   - Append to `IMAGE_MODELS` (`mapInput`, `maxRefs`, `label`) and adjust pricing.
3. **File format support**
   - Add to `mime.ts`, `FileBrowser` filters, and `PreviewPane`.
4. **Storage tweaks**
   - Use the helpers in `src/fs`. Always sanitize path segments and await `refreshTree` after writes.

Keep this mental model in mind: **React UI → `callModelEndpoint` → `writeBlob` → `refreshTree` → preview.** Any change that breaks one link will degrade the experience, so plan edits accordingly.
