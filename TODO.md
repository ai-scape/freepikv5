# Audit TODOs

- **High – Path traversal risk** (`server/index.js:333-365`):
  - Problem: `/publish` builds `fileName` from unchecked `project/sequence/shot/version` and joins directly into `destPath` without `toSafePath`. An attacker can include `../` to escape the workspace and overwrite arbitrary files.
  - Fix: Sanitize each metadata field (strict slug/ID regex), rebuild the destination via `toSafePath(publishDir, fileName)`, and reject any path that would escape `publish/{workspace}`.

- **High – Unauthenticated log sink** (`server/index.js:46-59`, `/log` handler `371-379`):
  - Problem: The auth hook skips `/log`, so anyone can POST arbitrary text into `debug.log`, enabling log poisoning and disk fill.
  - Fix: Enforce the Bearer token on `/log`, cap payload size, and optionally add basic rate limiting or disable the endpoint for production.

- **Medium – Silent overwrite on drag/drop uploads** (`src/components/FileBrowser.tsx:95-114`):
  - Problem: Dropped files save as `file.name` at workspace root with no collision handling, so dropping a duplicate name overwrites existing assets and breaks the date-based folder convention.
  - Fix: Route uploads into dated subfolders (e.g., `YYYY-MM-DD/`), check for existing files before write (append suffix or prompt), and surface progress/errors in the UI.

- **Medium – Object URL leak when trimming references** (`src/components/ControlsPane.tsx:461-469`):
  - Problem: When limiting reference images, extra entries are sliced but their `preview` object URLs are never revoked, leaking memory during long sessions.
  - Fix: Before trimming, revoke `URL.revokeObjectURL` for discarded previews and remove them from the registry.

- **Medium – Upscale uses Fal URL for KIE call** (`src/components/PreviewPane.tsx:340-475`):
  - Problem: The upscale flow uploads the image to Fal storage then calls a KIE endpoint; KIE likely cannot fetch Fal URLs, causing flaky failures and bypassing the file API storage guardrail.
  - Fix: Upload via a KIE-accessible path (or stream the blob directly if supported), otherwise first persist to the file API and pass that signed URL to KIE.

- **Medium – Generate allowed without workspace** (`src/components/ControlsPane.tsx:685-789`):
  - Problem: Users can queue generation with no active workspace; the job runs, but uploads are skipped and results are effectively dropped with no clear warning.
  - Fix: Disable “Generate” until a workspace connection exists (and required inputs/keys), or block job enqueue with a clear error toast.

- **Low – Tree listing scale/order issues** (`server/index.js:93-119` + `src/components/FileBrowser.tsx` sorting):
  - Problem: Every refresh reads the full recursive tree and sorts by `mtime`, which is `0` for directories, so folders sink to the bottom and large trees are slow.
  - Fix: Add directory-first sort, consider pagination/caching, and optionally expose size/date columns to improve perceived ordering.

- **Optional – Filters/mime cohesion** (`src/lib/mime.ts`, `src/components/FileBrowser.tsx`):
  - Problem: Extension filters are hardcoded in the component and not aligned with the mime map; adding formats requires touching multiple files and some types (gif/mov/audio) won’t filter cleanly.
  - Fix: Centralize an `EXT_FILTERS` map next to `mime.ts`, derive filter chips from it, and expand mime coverage for the common media types used.
