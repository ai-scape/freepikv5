# Agents Playbook

Use this reference alongside `README.md` and `docs/AGENT_GUIDE.md` when you need to reason about the Freepik Clone codebase, extend a workflow, or debug issues.

## 1. Snapshot
- **Stack:** React 19 + TypeScript + Vite 7 + TailwindCSS (frontend) with a Fastify file API server for storage/streaming.
- **Layout:** `src/app/page.tsx` renders a fixed grid: `ProjectBar` (top), then three columns — `ControlsPane` (320 px), `FileBrowser`, and `PreviewPane`.
- **State:** `src/state/catalog.tsx` stores the current workspace connection (`apiBase`, `workspaceId`, `token`), the file tree, filters/search query, and the selected entry. Actions are `setConnection`, `refreshTree(preferredPath?)`, `select`, `setFilters`, and `setQuery`.
- **Persistence:** Workspace connection is saved in localStorage; defaults come from `VITE_FILE_API_BASE` and `VITE_FILE_API_TOKEN`.

## 2. Storage & File API
- `server/index.js`
  - Fastify server with CORS + multipart.
  - Env: `FILE_API_PORT` (default 8787), `FILE_STORAGE_ROOT` (default `./data`), `FILE_API_TOKEN`, `FILE_API_CORS_ORIGIN`, `FILE_MAX_SIZE_MB`.
  - Routes: `/health`, `GET/POST /workspaces`, `GET /files?workspace=...` (flattened tree), `GET /files/:workspace/*` (Range-enabled stream), `POST /files` (multipart upload), `DELETE /files`.
  - Auth: Bearer token header or `?token=` query (for media tags).
  - Files stored under the workspace root using `images/YYYY-MM-DD` or `videos/YYYY-MM-DD`.
  - Config loading: reads `.env.server` first, then `.env` (both at repo root), so you can configure without exporting shell vars.
- `src/lib/api/files.ts`
  - `getDefaultConnection()` pulls env defaults.
  - `listFiles`, `uploadFile`, `fetchFileBlob`, `deleteFile`.
  - `getFileUrl(connection, relPath, { includeToken })` builds signed-ish URLs for previews/streams.
  - `listWorkspaces` / `createWorkspace` help the ProjectBar picker.
  - Drag payloads use `{ workspaceId, path, name, mime }` serialized under `FILE_ENTRY_MIME`.

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
  - Restores saved workspace connection on mount (or uses env defaults).
  - Lets users enter API base, token, and workspace id, create new workspaces, and connect/disconnect.
- `ControlsPane`
  - Houses the prompt/model controls, seed input, and drag-and-drop upload zones (start frame, optional end frame, image references). Each drop kicks off `uploadToFal`.
  - Builds payloads using `buildModelInput` (video) or `spec.mapInput` (image), and auto-renders every parameter described in the selected `ModelSpec`.
  - Calls `callModelEndpoint`, derives the file extension from the blob’s mime, generates a filename with `buildFilename`, and uploads via `uploadFile` to `images/` or `videos/` date folders.
  - After writing, it awaits `refreshTree(relPath)` so the new entry is selected in the browser.
- `FileBrowser`
  - Uses catalog state to render search input, extension chips, and file list from the file API. Filter chips live in `EXT_FILTERS`; update both the chip list and `mime.ts` when adding formats.
  - Clicking a row triggers `select(entry)`; the right column instantly previews it.
  - Drag payload includes the active `workspaceId` + `relPath` (JSON).
- `PreviewPane`
  - Streams via `getFileUrl` (token added to the query) and renders `<img>` or `<video>` plus metadata.
  - Frame extraction uploads PNGs back via `uploadFile` and refreshes the tree.
  - Drag payload mirrors `FileBrowser` for reuse in drop zones.

## 5. Primary Flow
1. File API server runs (`npm run dev:server` or `npm run dev:all`); ProjectBar connects to a workspace (using env defaults or manual input).
2. User configures prompts/uploads in `ControlsPane` (provider keys come from `VITE_FAL_KEY` / `VITE_KIE_KEY`).
3. `callModelEndpoint` returns a blob; `uploadFile` stores it under `images/YYYY-MM-DD` or `videos/YYYY-MM-DD`.
4. `refreshTree(relPath)` reloads the directory tree and selects the written file.
5. `FileBrowser` shows the entry; `PreviewPane` streams it inline (Range-enabled).

## 6. Dev Guardrails
- **Server required:** Keep storage routed through the file API (`server/index.js`); do not reintroduce browser File System Access for persistence.
- **Auth alignment:** `VITE_FILE_API_TOKEN` should match `FILE_API_TOKEN`; `getFileUrl(..., { includeToken: true })` is how the media tags stay authorized.
- **Browser:** Chromium recommended for best performance, but File System Access is no longer required.
- **Do not** add `/api/assets` or reintroduce `@fal-ai/client`.
- **Naming:** If you change how filenames are built, adjust `filename.ts` and keep the `model + slug + nanoid` pattern so automations can trace renders.
- **Pricing:** Update `pricing.ts` when adding/changing models so the badge stays correct.
- **Mime/filter updates:** Extend `mime.ts`, adjust `EXT_FILTERS`, and ensure `PreviewPane` knows how to render the new type (server streaming uses `mime-types`).
- **Lint/tests:** Run `npm run lint` and `npm run build`. Manual smoke test: `npm run dev:all` → connect default workspace → drop start/reference frames → run both an image + a video model → confirm files appear in the browser and preview/drag/drop still work → capture a frame back to the workspace.
- **Env files:** Place server config in `.env.server` (or `.env`) and frontend config in `.env.local`; `dev:all` will pick both up automatically.

## 7. Extension Checklist
1. **New video model**
   - Update `models.json` or `models-extra.ts` and add a pricing entry.
   - Ensure `ControlsPane` exposes any new params; use `UnifiedPayload` keys or extend the form.
2. **New image model**
   - Append to `IMAGE_MODELS` (`mapInput`, `maxRefs`, `label`) and adjust pricing.
3. **File format support**
   - Add to `mime.ts`, `FileBrowser` filters, `PreviewPane`, and ensure the server serves the correct mime (via `mime-types`).
4. **Storage tweaks**
   - Update both the file API (`server/index.js`) and the frontend client (`src/lib/api/files.ts`). Always sanitize path segments and await `refreshTree` after writes.

Keep this mental model in mind: **React UI → `callModelEndpoint` → `uploadFile` → `refreshTree` → preview (via `getFileUrl`).** Any change that breaks one link will degrade the experience, so plan edits accordingly.
