# AI Asset Studio

> 🎨 A React + Fastify setup for generating images and videos using FAL and KIE AI models, backed by a lightweight file API server.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ What is this?

AI Asset Studio is a powerful yet simple tool that lets you generate AI-powered images and videos. A small file API server handles storage so the browser can stay focused on generation and preview. Run one command to start both the frontend and the file server, connect to a workspace, and start creating.

**Perfect for:**
- 🎬 Video creators and editors
- 🎨 Digital artists and designers  
- 📸 Content creators
- 🚀 Anyone who wants to explore AI generation

## 🚀 Getting Started in 4 Simple Steps

### 1. Install & Run

```bash
# Install dependencies
npm install

# Start frontend (Vite) + file server together
npm run dev:all
```

Frontend: `http://localhost:5173`  
File API: `http://localhost:8787` (writes to `./data` by default)

Use Chrome or Edge for best performance; the app no longer depends on the File System Access API, so other modern browsers work too.

### 2. Set Up Frontend Env (.env.local)

```env
VITE_FAL_KEY=your_fal_api_key_here
VITE_KIE_KEY=your_kie_api_key_here
VITE_FILE_API_BASE=http://localhost:8787
VITE_FILE_API_TOKEN=devtoken
```

### 3. Set Up Server Env (via file, no terminal exports)

Create a `.env.server` (or `.env`) in the project root for the file API server:

```env
FILE_API_PORT=8787
FILE_STORAGE_ROOT=/absolute/path/to/your/folder   # e.g., ./data
FILE_API_TOKEN=devtoken                           # match VITE_FILE_API_TOKEN
FILE_API_CORS_ORIGIN=http://localhost:5173
FILE_MAX_SIZE_MB=1024
```

The server loads `.env.server` (preferred) and then `.env` automatically. No need to export vars in your shell.

### 4. Connect a Workspace

1. In the top bar, enter your file API URL (defaults to `http://localhost:8787`).
2. Enter/select a workspace id (defaults to `default` or create a new one).
3. Paste the token you set on the server.
4. Click **Connect**. The UI will load the workspace file list automatically.

That's it! You're ready to create. 🎉

## 📖 User Guide

### 1. Connecting to a Workspace
To start using the application, you need to connect to a workspace:
1.  **API URL**: Enter your File API URL (e.g., `http://localhost:8787`).
2.  **Workspace ID**: Enter a name for your workspace (e.g., `my-project`).
3.  **Token**: Enter your API token if required.
4.  Click **Connect**.

### 2. Generating Assets
Use the panel on the left to create content:
-   **Image Tab**: Select a model, enter a prompt, and configure settings like aspect ratio.
-   **Video Tab**: Generate videos from text or animate existing images.
-   **Upscale Tab**: Enhance the resolution of your generated images.

### 3. Managing Files
The central pane shows your generated files:
-   **View Modes**: Toggle between Grid (thumbnails) and List (details) views.
-   **Filtering**: Use the "Images" and "Videos" pills to filter content.
-   **Drag & Drop**: Drag files from the browser to your desktop to download them.
-   **Video Preview**: Hover over video thumbnails in grid view to play a preview.
-   **Deletion**: Click the trash icon to delete files instantly.

### 4. Preview & Compare
The right-side pane offers detailed viewing options:
-   **Preview Mode**: View full-size images or play videos. Extract frames from videos or crop images.
-   **Compare Mode**: Drag two images into the comparison slots to use a slider for side-by-side comparison.
-   **Full Screen**: Toggle full-screen mode for an immersive view.

### 5. KIE Credits
Monitor your usage limits with the credit tracker in the top bar. Click the refresh icon to update your balance manually.

## 🎯 Key Features

### ✅ **One Command Dev** - `npm run dev:all` starts frontend + file API server
### ✅ **Workspace Storage** - Files organized on the server (`images/YYYY-MM-DD`, `videos/YYYY-MM-DD`)
### ✅ **20+ AI Models** - Video, image, and upscaling models included
### ✅ **Smart Controls** - UI automatically adapts to each model's parameters
### ✅ **Prompt Expansion** - Integrated Groq LLM for enhancing prompts
### ✅ **Built-in Browser** - Browse, preview, and search your generated files
### ✅ **Persistent** - Workspace and token are remembered between sessions

## 🎬 Available Models

### Video Generation
- **Kling 2.5 Pro** - High-quality video generation
- **Veo 3.1 Fast** - Google's latest video model (Text & I2V)
- **Hailuo 2.3 Pro** - Minimax's creative video generator
- **Wan 2.5** - Alibaba's advanced video model
- **Kling 2.1 Pro** - Cost-effective video generation
- **Seedance V1 Pro** - Bytedance's video generation model

### Image Generation & Editing
- **Nano Banana (Edit/Pro)** - Creative artistic images and editing
- **Seedream V4** - ByteDance image editing
- **Qwen Image Edit Plus** - Advanced image editing

### Video Upscaling
- **Topaz Video Upscaler** - Industry standard upscaling
- **FlashVSR** - High-quality video upscaling
- **ByteDance Upscaler** - Professional video enhancement

See the full model catalog in the [Technical Docs](video%20models%20kie%20docs.md) section.

## 💡 Tips for Great Results

### 📤 Drag and Drop
You can now drag and drop files directly from your computer into the File Browser to upload them instantly! This makes it easy to bring in your own assets for editing or reference.

### ✍️ Writing Prompts

**Good prompts are specific:**
- ❌ "A cool video"
- ✅ "A red sports car driving through a neon-lit city at night, rain on windshield, cinematic"

**Include these details:**
- What's happening (action/subject)
- Style (cinematic, photorealistic, artistic)
- Lighting (golden hour, dramatic, soft)  
- Camera movement (zoom in, pan left, static)
- Mood (peaceful, energetic, mysterious)

### 🎥 Video Best Practices

- Use high-quality start frames (at least 1024x1024)
- Keep prompts focused on one main action  
- For transitions, use the end frame feature
- Some models work better with specific aspect ratios

### 🖼️ Image Best Practices

- Be descriptive but concise (50-200 characters works well)
- Use artistic terms: "oil painting", "digital art", "3D render"
- Specify composition: "close-up", "wide angle", "bird's eye view"  
- Try different size presets for various uses

## 🔧 Advanced Features

### Reference Images/Videos

Many models support reference materials:
- **Style Transfer** - Upload an image to match its style
- **Character Consistency** - Keep characters looking the same across generations
- **Scene References** - Provide multiple reference images for complex scenes

### Fine-Tuning Parameters

Each model exposes different controls:
- **FPS** - Frames per second for videos
- **Resolution** - Output quality (1080p, 2K, 4K)
- **Steps** - Generation quality vs speed trade-off
- **Seed** - Reproducible generations (save seeds you like!)

### Batch Organization

Files are automatically organized:
```
workspace-root/
├── images/
│   ├── 2025-11-20/
│   └── 2025-11-21/
└── videos/
    ├── 2025-11-20/
    └── 2025-11-21/
```

## 🛟 Troubleshooting

### Can't connect to workspace?
- Make sure `npm run dev:server` (or `dev:all`) is running on `FILE_API_PORT`.
- Confirm `VITE_FILE_API_BASE` matches the running server URL.
- Ensure `VITE_FILE_API_TOKEN` matches `FILE_API_TOKEN` on the server.
- If the server is remote, add its origin to `FILE_API_CORS_ORIGIN`.

### API key errors?
- Check `.env.local` file exists and keys are correct.
- Restart dev server after changing `.env.local`.
- Ensure keys start with `VITE_`.

### Generation failing?
- Check browser console (F12) for errors.
- Verify your API key has available credits.
- Try a different model or simpler prompt.
- Check file sizes (upload limit is controlled by `FILE_MAX_SIZE_MB` on the server).

### Slow generations?
- High-quality models take 30-90 seconds.
- Check your internet connection.
- Some models have queue times during peak hours.

## 🏗️ Project Structure

```
server/                # Fastify file API (storage, streaming, workspaces)
src/
├── app/               # Main application shell
├── components/        # UI components (ProjectBar connects to workspace)
├── lib/               # Core logic and APIs
│   ├── api/files.ts       # File API client + types
│   ├── models.json        # Video model catalog
│   ├── image-models.ts    # Image model catalog
│   ├── pricing.ts         # Model pricing info
│   └── providers/         # API integrations (FAL, KIE)
└── state/             # React context for app state (catalog, workspace)
```

## 🚢 Deployment

Build for production:

```bash
npm run build
```

Deploy the frontend (`dist/`) alongside the file API server. Any host works as long as the frontend can reach the server over HTTPS and CORS is configured. Remember to set CSP to allow `https://fal.run` and `https://api.kie.ai`.

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Step-by-step instructions for users
- **[Agent Guide](docs/AGENT_GUIDE.md)** - Advanced automation tips
- **[API Reference](video%20models%20kie%20docs.md)** - Full model catalog and API details

## 🤝 Contributing

This is a specialized tool built for production use. If you find bugs or have suggestions:
1. Check existing issues
2. Open a detailed bug report with steps to reproduce
3. Include browser version and console errors

## 📄 License

MIT License - feel free to use this for your own projects!

## ⚡ Technical Notes

- **File API Server** - Fastify handles uploads, listing, and Range-enabled streaming
- **Workspace Model** - Files saved to `images/YYYY-MM-DD` or `videos/YYYY-MM-DD` under `FILE_STORAGE_ROOT`
- **Auth** - Bearer token (`FILE_API_TOKEN` / `VITE_FILE_API_TOKEN`); token allowed via query for media playback
- **React 19** - Latest React with TypeScript
- **Vite** - Lightning-fast development and builds
- **TailwindCSS** - Utility-first responsive styling

---

**Built with ❤️ for creators**

Need help? Check the [User Guide](docs/USER_GUIDE.md) or open an issue!
