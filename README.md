# Freepik Clone — AI Asset Studio

Freepik Clone is a Chrome-focused AI studio for triggering FAL and KIE pipelines and writing results directly to disk via the File System Access API. The UI uses a fixed three-column grid (controls → file browser → preview) so operators can tweak prompts, keep a live view of the project folder, and review finished renders without leaving the browser.

## Highlights
- **Browser-only runtime:** No Node middleware or `/api/assets` endpoints. All persistence relies on Chrome’s File System Access API with an Origin Private File System (OPFS) fallback if folder access is denied.
- **Three-column workflow:** Project bar (folder, storage status, permission controls), control pane (prompt, drag-and-drop uploads, model catalog, generation params), file browser (search + extension filters), and inline preview (image/video with metadata + download).
- **Model-aware controls:** Every video pipeline automatically exposes the exact parameters defined in `models.json`/`models-extra.ts`; fields appear/disappear as you change models, so the UI always matches the upstream provider spec.
- **Model catalog:** Video specs come from `src/lib/models.json` + `models-extra.ts`; image specs live in `src/lib/image-models.ts`. Pricing badges are loaded from `src/lib/pricing.ts` and displayed next to the Generate button.
- **Direct disk writes:** Generated blobs are saved under `images/YYYY-MM-DD` or `videos/YYYY-MM-DD` inside the selected folder. Filenames combine the model id, sanitized prompt slug, optional seed, and a nanoid suffix.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the app in an up-to-date Chromium browser (Chrome/Edge). Safari/Firefox lack the File System Access APIs required for saving renders.
4. Click **Pick Folder** in the project bar, select a workspace directory (or accept the OPFS fallback), and grant read/write permission.
5. Add your provider keys to `.env` — always set `VITE_FAL_KEY=...`, and add `VITE_KIE_KEY=...` when using KIE pipelines. The client reads these from `import.meta.env`; there’s no UI prompt.
6. Drag in a start frame, optional end frame or reference images, tweak the prompt/params, and run **Generate**. New files appear in the middle column immediately after the write succeeds.

## Storage & Permissions
- Directory handles persist inside IndexedDB (`fs-handles/project`). On load, the app re-requests permission via `queryPermission`/`requestPermission`.
- If the user cancels the picker or the API isn’t available, the app falls back to `navigator.storage.getDirectory()` (OPFS).
- `navigator.storage.persist()` is invoked on startup; the badge in the project bar shows whether the browser granted durable storage.

## Model Catalog Reference

### Video Pipelines
- `kling-2.5-pro` and `kling-2.1-pro` — turbo I2V pipelines now routed through KIE Jobs API polling.
- `kling-2.1-pro` — adds end-frame control for transitions.
- `veo-3.1-quality-text`, `veo-3.1-quality-firstlast`, `veo-3.1-fast-text`, `veo-3.1-fast-firstlast`, `veo-3.1-fast-reference` — Veo 3.1 pipelines via KIE Jobs (text-only, first/last frames, and reference material modes).
- `ltx-2-pro`, `ltx-2-fast` — Lightricks LTX variants with FPS / resolution knobs.
- `hailuo-2.3-pro`, `hailuo-02-pro` — Minimax pipelines with prompt optimizers (both routed via KIE Jobs API).
- `seedance-pro-fast`, `seedance-pro` — ByteDance Seedance endpoints.
- `wan-2.2-turbo`, `wan-2.5-i2v` — Wán diffusion video suites.

### Image Pipelines
- `flux-kontext-pro`, `nano-banana`, `nano-banana-edit`
- `nano-banana` text mode now routes through KIE’s Jobs API (`/api/v1/jobs/createTask` + `recordInfo`) so the app polls for task completion before saving the blob locally.
- `imagen-4`, `imagen-4-fast`
- `qwen-image-edit-plus` — now runs through the KIE Jobs API (`qwen/image-edit`) so acceleration, guidance scale, steps, and safety toggles map 1:1 to the provider request.
- `seedream-v4-edit` — ByteDance Seedream edit flow via KIE Jobs (`bytedance/seedream-v4-edit`) with size/resolution/max-image controls surfaced in the UI.
- `chrono-edit`

Model specs live in:
- `src/lib/models.json` — primary video definitions.
- `src/lib/models-extra.ts` — adapter-driven video endpoints.
- `src/lib/image-models.ts` — image specs + payload mappers.
- `src/lib/pricing.ts` — badge labels for every model id.

## Deployment Guidelines
- `npm run build` outputs a static bundle in `dist/`. Deploy to any static host (Vercel, Netlify, Cloudflare Pages, etc.).
- Serve over HTTPS so the File System Access API and FAL requests stay available.
- Set a CSP that allows `https://fal.run` and `https://api.kie.ai` (plus any regional upload hosts you require) inside `connect-src`.

## Project Structure
- `src/app/page.tsx` — grid layout shell (ProjectBar + ControlsPane + FileBrowser + PreviewPane).
- `src/components/ProjectBar.tsx` — folder persistence, permission refresh, storage badge.
- `src/components/ControlsPane.tsx` — prompt/model controls, drag-and-drop uploads, dynamic parameter builder, and provider-aware `callModelEndpoint` orchestration.
- `src/components/FileBrowser.tsx` — live directory tree with search/filters.
- `src/components/PreviewPane.tsx` — inline preview + metadata.
- `src/fs/*` — File System Access helpers (`dir`, `write`, `tree`, `preview`).
- `src/lib/providers/` — shared provider router, helpers, and the KIE client (fal + kie). `src/lib/fal.ts` still houses the FAL fetch client plus `uploadToFal`.
- `src/lib/filename.ts`, `src/lib/mime.ts`, `src/lib/storage-mode.ts` — utility helpers.
- `src/state/catalog.tsx` — React context that tracks folder handle, file entries, filters, and selection.

Further automation tips live in [`docs/AGENT_GUIDE.md`](docs/AGENT_GUIDE.md).
