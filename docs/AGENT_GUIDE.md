# Agent Guide

This guide is designed for AI agents and developers to quickly understand the codebase, architecture, and development workflows of AI Asset Studio.

## 🏗️ Architecture Overview

The application is a **client-side only** React application (Vite + TypeScript) that interacts directly with AI provider APIs (KIE, FAL). It uses the **File System Access API** to read/write files directly to the user's local disk, bypassing the need for a backend server or downloads folder.

### Key Directories

- **`src/app`**: Main application shell and layout.
- **`src/components`**: UI components.
  - `ControlsPane.tsx`: The core logic for model selection, parameter inputs, and generation triggers.
  - `FileBrowser.tsx`: Displays the file tree of the selected project folder.
  - `PreviewPane.tsx`: Handles file previews (images/videos).
  - `ProjectBar.tsx`: Manages folder selection and permission persistence.
- **`src/fs`**: File system utilities (OPFS fallback, directory walking, blob writing).
- **`src/lib`**: Core business logic.
  - `models.json`: **Single source of truth** for Video models (params, endpoints, pricing).
  - `image-models.ts`: Definitions for Image models.
  - `upscale-models.ts`: Definitions for Upscale models.
  - `providers/`: API client implementations for KIE and FAL.
- **`src/state`**: Global state management via React Context (`useCatalog`).

## 🧩 Key Concepts

### 1. Model Definitions
Models are defined in `src/lib/models.json` (Video) and `src/lib/image-models.ts` (Image).
- **Video Models:** Use a JSON schema to define parameters (`params`). The UI dynamically renders controls based on this schema.
- **Image Models:** Defined as TypeScript objects with `mapInput` functions to transform UI state into API payloads.
- **Pricing:** Pricing strings are now embedded directly in the model definitions (`pricing` field).

### 2. API Integration (`src/lib/providers`)
- **KIE.ai:** The primary provider for video and image generation.
  - `src/lib/kie.ts`: Handles authentication, request signing, and polling for "Jobs API" models.
  - Supports both **Jobs API** (async polling) and **Direct API** (sync response, e.g., VEO/Flux).
- **FAL.ai:** Used primarily for **temporary file storage** (`uploadToFal`) because KIE does not currently provide a general-purpose storage API.
  - `src/lib/fal.ts`: Handles uploads to `https://fal.run/storage/upload`.

### 3. File System (`src/fs`)
- **Direct Access:** The app requests R/W access to a local folder.
- **Persistence:** Directory handles are stored in IndexedDB so users don't have to re-pick folders on reload (though permissions must be re-granted).
- **OPFS Fallback:** If the user denies access or uses an unsupported browser, the app falls back to the Origin Private File System (browser-internal storage).

## 🛠️ Development Workflows

### Adding a New Video Model
1.  Open `src/lib/models.json`.
2.  Add a new entry to the `models` array.
3.  Define `id`, `label`, `endpoint`, `pricing`, and `params`.
4.  **Note:** If the model uses the standard KIE Jobs API, no code changes are needed—the UI will automatically render the new model.

### Adding a New Image Model
1.  Open `src/lib/image-models.ts`.
2.  Add a new `ImageModelSpec` to the `IMAGE_MODELS` array.
3.  Implement `mapInput` to transform the standard `ImageJob` into the provider's specific payload format.

### Modifying the UI
- **`ControlsPane.tsx`** is the main control center. It is divided into three explicit sections:
  - `modelKind === "image"`
  - `modelKind === "video"`
  - `modelKind === "upscale"`
- Each section handles its own specific inputs (Reference Uploads, Prompts, Seeds, etc.).

## ⚠️ Critical Constraints

1.  **Browser Support:** The app relies on the **File System Access API**, which is only supported in Chromium-based browsers (Chrome, Edge, Brave). Firefox and Safari have limited or no support.
2.  **Secrets:** API keys (`VITE_FAL_KEY`, `VITE_KIE_KEY`) must be set in `.env.local`. **NEVER commit these keys.**
3.  **No Backend:** Do not introduce Node.js middleware or server-side logic. Everything must run in the browser.

## 🔍 Troubleshooting

- **"Missing API Key":** Check `.env.local` and restart the dev server.
- **"Permission Denied":** The user must explicitly grant R/W access to the folder.
- **"Upload Failed":** Check `uploadToFal` in `ControlsPane.tsx`. Large files (>50MB) might fail depending on FAL's limits.

## 🚀 Quick Restart for Agents

1.  **Read `src/lib/models.json`** to understand the current video model capabilities.
2.  **Read `src/components/ControlsPane.tsx`** to see how inputs are mapped to API calls.
3.  **Check `src/lib/providers/index.ts`** to see available API clients.

