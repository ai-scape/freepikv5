# Agent Guide

Automation agents extending this project should understand its Chrome-only, filesystem-first architecture before making changes.

## Runtime Primitives

- **File System Access API:** All renders are written straight to the user-selected folder (or OPFS fallback) via helpers in `src/fs`. Never reintroduce `/api/assets` routes or Node middleware.
  - `fs/dir.ts` handles picking/saving directory handles, rehydrating them from IndexedDB, and ensuring read/write permission.
  - `fs/write.ts`, `fs/tree.ts`, and `fs/preview.ts` implement blob writes, directory walking, and object URL previews.
- **Global state:** `src/state/catalog.tsx` stores the active handle, file tree, filters, and current selection inside a React context. When adding features that touch the tree, call `refreshTree(preferredPath)` so selection stays in sync.
- **Provider clients:** `src/lib/providers` centralizes `callModelEndpoint`, `getProviderKey`, and provider metadata. `src/lib/fal.ts` and `src/lib/kie.ts` implement the fetch clients (keys live in `VITE_FAL_KEY` / `VITE_KIE_KEY`), while `uploadToFal` continues to handle drag-and-drop FormData uploads to `https://fal.run/storage/upload`. Do not add new backend shims or `@fal-ai/client` usage beyond that uploader.
- **Model metadata:** Video specs live in `src/lib/models.json` + `models-extra.ts`, while image specs are defined in `src/lib/image-models.ts`. Pricing badges for the controls pane come from `src/lib/pricing.ts`.
- **UI shell:** `src/app/page.tsx` composes `ProjectBar`, `ControlsPane`, `FileBrowser`, and `PreviewPane` inside a fixed `grid-cols-[320px_1fr_1fr]`. Keep this layout when adding panes or overlays.
- **Controls pane:** `src/components/ControlsPane.tsx` now handles prompt inputs plus drag-and-drop upload zones (start frame, optional end frame, image references). Upload success is required before calling `callModelEndpoint`, so keep the pending-upload safeguards in place. The rest of the controls render dynamically from `ModelSpec.params`, so extending/renaming params in `models.json` automatically updates the UI.

## Development Practices

- **Environment:** The app only works in Chromium browsers because of the File System Access API. Any new code paths must guard against unsupported browsers and fall back to OPFS when folder picking fails.
- **Lint/tests:** Lint with `npm run lint`. There is no automated test suite, so validate manually: pick folder → set `VITE_FAL_KEY` → drop frames/refs → run image/video model → confirm files appear and preview loads after reload.
- **Secrets:** Never ship keys inside the repo. The runtime reads `import.meta.env.VITE_FAL_KEY` for FAL and `import.meta.env.VITE_KIE_KEY` for KIE; document updates should remind users to set these in `.env`.
- **Persistence state:** The project bar surfaces `navigator.storage.persist()` status and exposes “Re-request Permission.” If you add new long-running writes, surface failures through that bar (or ControlsPane status) instead of silent console logs.

## Safe Editing Tips

- Update `src/lib/pricing.ts` whenever rate cards change; UI relies on formatted `amount` values.
- When introducing new file types, expand `src/lib/mime.ts` and adjust `EXT_FILTERS` in `FileBrowser` so filters remain accurate.
- If you modify file naming, update `src/lib/filename.ts` and keep the `modelId + slug + nanoid` format so downstream automations can match assets.
- For new storage behaviors, stick to the helpers in `src/fs/*`. They already sanitize paths and create directories recursively—avoid reinventing similar logic.

Use this guide as a checklist when adding models, tweaking pricing, or changing the filesystem workflow. The app’s value proposition is “Chrome-only, zero-backend AI orchestration,” so keep that constraint intact.
