# AI Asset Studio

> 🎨 A browser-based AI studio for generating images and videos using FAL and KIE AI models

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ What is this?

AI Asset Studio is a powerful yet simple tool that lets you generate AI-powered images and videos directly in your browser. No complicated setup, no servers to maintain - just open the app, pick a folder, and start creating!

**Perfect for:**
- 🎬 Video creators and editors
- 🎨 Digital artists and designers  
- 📸 Content creators
- 🚀 Anyone who wants to explore AI generation

## 🚀 Getting Started in 3 Simple Steps

### 1. Install & Run

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open your browser to `http://localhost:5173`

**Important:** Use Chrome, Edge, or another Chromium-based browser. Safari and Firefox don't support the file system features we need.

### 2. Set Up Your API Keys

Create a file called `.env.local` in the project root:

```env
VITE_FAL_KEY=your_fal_api_key_here
VITE_KIE_KEY=your_kie_api_key_here
```

**Get your keys:**
- **FAL.ai:** Sign up at [fal.ai](https://fal.ai) → Dashboard → API Keys
- **KIE.ai:** Sign up at [kie.ai](https://kie.ai) → Account Settings → Generate API Key

### 3. Pick a Project Folder

1. Click **"Pick Folder"** in the top bar
2. Select where you want to save your generated files
3. Grant permission when prompted

That's it! You're ready to create. 🎉

## 📖 How to Use

### Quick Video Generation

1. Select a video model (try "kling-2.5-pro")
2. Upload a start frame image (drag & drop or click browse)
3. Write what you want to happen: "A butterfly lands on a flower"
4. Click **Generate**
5. Wait 30-60 seconds
6. Your video appears in the file browser!

### Quick Image Generation

1. Select an image model (try "flux-kontext-pro")
2. Write a detailed description: "A photorealistic portrait of a cat wearing a wizard hat"
3. Click **Generate**
4. Your image is ready in seconds!

For more detailed instructions, see the [**User Guide**](docs/USER_GUIDE.md)

## 🎯 Key Features

### ✅ **Zero Setup** - No backend, no databases, no complicated configuration
### ✅ **Direct to Disk** - Files save straight to your computer
### ✅ **20+ AI Models** - Video, image, and upscaling models included
### ✅ **Smart Controls** - UI automatically adapts to each model's parameters
### ✅ **Built-in Browser** - Browse, preview, and search your generated files
### ✅ **Persistent** - Your project folder is remembered between sessions

## 🎬 Available Models

### Video Generation
- **Kling 2.5 Pro** - High-quality video generation
- **Veo 3.1** - Google's latest video model (Fast & I2V)
- **Hailuo 2.3** - Minimax's creative video generator
- **Wan 2.5** - Alibaba's advanced video model
- **Seedance** - Bytedance's video generation model

### Image Generation
- **Flux Kontext Pro/Max** - Professional-grade images & editing
- **Nano Banana** - Creative artistic images
- **Seedream V4** - ByteDance image editing

### Video Upscaling
- **Topaz Video Upscaler** - Industry standard upscaling
- **FlashVSR** - High-quality video upscaling
- **ByteDance Upscaler** - Professional video enhancement

See the full model catalog in the [Technical Docs](#project-structure) section below.

## 💡 Tips for Great Results

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
your-project-folder/
├── images/
│   ├── 2025-11-20/
│   └── 2025-11-21/
└── videos/
    ├── 2025-11-20/
    └── 2025-11-21/
```

## 🛟 Troubleshooting

### Can't pick a folder?
- ✅ Use Chrome or Edge (Chromium browsers)
- ❌ Safari and Firefox don't support File System Access API

### API key errors?
- Check `.env.local` file exists and keys are correct  
- Restart dev server after changing `.env.local`
- Ensure keys start with `VITE_`

### Generation failing?
- Check browser console (F12) for errors
- Verify your API key has available credits
- Try a different model or simpler prompt
- Check file sizes (max ~20MB for uploads)

### Slow generations?
- High-quality models take 30-90 seconds
- Check your internet connection
- Some models have queue times during peak hours

For more help, see the [User Guide](docs/USER_GUIDE.md).

## 🏗️ Project Structure

```
src/
├── app/               # Main application shell
├── components/        # UI components
│   ├── ControlsPane.tsx    # Model selection & generation controls
│   ├── FileBrowser.tsx     # File list & search
│   ├── PreviewPane.tsx     # File preview
│   └── ProjectBar.tsx      # Folder picker & permissions  
├── fs/                # File system utilities
├── lib/               # Core logic
│   ├── models.json         # Video model catalog
│   ├── image-models.ts     # Image model catalog
│   ├── pricing.ts          # Model pricing info
│   └── providers/          # API integrations (FAL, KIE)
└── state/             # React context for app state
```

## 🚢 Deployment

Build for production:

```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify  
- Cloudflare Pages
- Any static hosting service

**Requirements:**
- Must be served over HTTPS
- Set CSP to allow `https://fal.run` and `https://api.kie.ai`

## 📚 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Step-by-step instructions for users
- **[Agent Guide](docs/AGENT_GUIDE.md)** - Advanced automation tips

## 🤝 Contributing

This is a specialized tool built for production use. If you find bugs or have suggestions:
1. Check existing issues
2. Open a detailed bug report with steps to reproduce
3. Include browser version and console errors

## 📄 License

MIT License - feel free to use this for your own projects!

## ⚡ Technical Notes

- **No Server Required** - 100% client-side, no backend needed
- **File System Access API** - Direct disk writes without downloads folder
- **IndexedDB** - Persist folder handles between sessions  
- **OPFS Fallback** - Origin Private File System when folder access denied
- **React 19** - Latest React with TypeScript
- **Vite** - Lightning-fast development and builds
- **TailwindCSS** - Utility-first responsive styling

---

**Built with ❤️ for creators**

Need help? Check the [User Guide](docs/USER_GUIDE.md) or open an issue!
